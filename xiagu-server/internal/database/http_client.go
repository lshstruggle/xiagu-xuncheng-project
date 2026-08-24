package database

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math/rand/v2"
	"net/http"
	"net/url"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/bson"
)

var (
	ErrDocumentNotFound = errors.New("document not found")
	ErrDuplicateWrite   = errors.New("duplicate write")
	ErrDatabaseConflict = errors.New("database transaction conflict")
)

// TokenProvider supplies the server-side credential used by CloudBase HTTP API.
// Implementations must never expose the token in returned errors.
type TokenProvider interface {
	Token(context.Context) (string, error)
}

type StaticToken string

func (t StaticToken) Token(context.Context) (string, error) {
	if strings.TrimSpace(string(t)) == "" {
		return "", errors.New("CloudBase API key is required")
	}

	return string(t), nil
}

type HTTPClientConfig struct {
	EnvironmentID string
	Instance      string
	Database      string
	BaseURL       string
	Timeout       time.Duration
}

// HTTPClient calls the CloudBase document database HTTP API.
type HTTPClient struct {
	baseURL       string
	tokenProvider TokenProvider
	httpClient    *http.Client
}

type APIError struct {
	StatusCode int
	Code       string
	Message    string
	RequestID  string
}

func (e *APIError) Error() string {
	requestSuffix := ""
	if e.RequestID != "" {
		requestSuffix = fmt.Sprintf(" (request_id=%s)", e.RequestID)
	}
	if e.Code != "" {
		return fmt.Sprintf(
			"CloudBase database request failed: %s%s",
			e.Code,
			requestSuffix,
		)
	}

	return fmt.Sprintf(
		"CloudBase database request failed: HTTP %d%s",
		e.StatusCode,
		requestSuffix,
	)
}

type runCommandsRequest struct {
	Commands      []any  `bson:"commands" json:"commands"`
	TransactionID string `bson:"transactionId,omitempty" json:"transactionId,omitempty"`
}

type runCommandsResponse struct {
	RequestID string            `json:"requestId"`
	List      []json.RawMessage `json:"list"`
	Code      string            `json:"code,omitempty"`
	Message   string            `json:"message,omitempty"`
}

type transactionContextKey struct{}

func transactionIDFromContext(ctx context.Context) string {
	transactionID, _ := ctx.Value(transactionContextKey{}).(string)
	return transactionID
}

func NewHTTPClient(
	cfg HTTPClientConfig,
	tokenProvider TokenProvider,
) (*HTTPClient, error) {
	environmentID := strings.TrimSpace(cfg.EnvironmentID)
	if environmentID == "" {
		return nil, errors.New("CloudBase environment ID is required")
	}

	instance := strings.TrimSpace(cfg.Instance)
	if instance == "" {
		instance = "(default)"
	}

	databaseName := strings.TrimSpace(cfg.Database)
	if databaseName == "" {
		databaseName = "(default)"
	}

	baseURL := strings.TrimRight(strings.TrimSpace(cfg.BaseURL), "/")
	if baseURL == "" {
		baseURL = fmt.Sprintf(
			"https://%s.api.tcloudbasegateway.com",
			environmentID,
		)
	}

	parsedBaseURL, err := url.Parse(baseURL)
	if err != nil || parsedBaseURL.Scheme == "" || parsedBaseURL.Host == "" {
		return nil, errors.New("CloudBase database base URL is invalid")
	}

	timeout := cfg.Timeout
	if timeout <= 0 {
		timeout = 10 * time.Second
	}

	databasePath := fmt.Sprintf(
		"/v1/database/instances/%s/databases/%s",
		url.PathEscape(instance),
		url.PathEscape(databaseName),
	)

	return &HTTPClient{
		baseURL:       baseURL + databasePath,
		tokenProvider: tokenProvider,
		httpClient: &http.Client{
			Timeout: timeout,
		},
	}, nil
}

func (c *HTTPClient) RunCommands(
	ctx context.Context,
	commands []any,
	transactionID string,
) ([]json.RawMessage, error) {
	if len(commands) == 0 {
		return nil, errors.New("at least one database command is required")
	}

	token, err := c.tokenProvider.Token(ctx)
	if err != nil {
		return nil, fmt.Errorf("get CloudBase database credential: %w", err)
	}

	requestBody, err := marshalExtendedJSON(runCommandsRequest{
		Commands:      commands,
		TransactionID: transactionID,
	})
	if err != nil {
		return nil, fmt.Errorf("encode CloudBase database request: %w", err)
	}

	request, err := http.NewRequestWithContext(
		ctx,
		http.MethodPost,
		c.baseURL+"/commands",
		bytes.NewReader(requestBody),
	)
	if err != nil {
		return nil, fmt.Errorf("create CloudBase database request: %w", err)
	}

	request.Header.Set("Authorization", "Bearer "+token)
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Accept", "application/json")

	response, err := c.httpClient.Do(request)
	if err != nil {
		return nil, fmt.Errorf("call CloudBase database: %w", err)
	}
	defer response.Body.Close()

	responseBody, err := io.ReadAll(io.LimitReader(response.Body, 16<<20))
	if err != nil {
		return nil, errors.New("read CloudBase database response")
	}

	if response.StatusCode < http.StatusOK ||
		response.StatusCode >= http.StatusMultipleChoices {
		return nil, decodeAPIError(response.StatusCode, responseBody)
	}

	var result runCommandsResponse
	// Keep list items as raw strict Extended JSON. Each collection operation
	// decodes its own result into the target BSON model afterwards.
	if err := json.Unmarshal(responseBody, &result); err != nil {
		return nil, errors.New("decode CloudBase database response")
	}

	if result.Code != "" {
		return nil, mapAPIError(&APIError{
			StatusCode: response.StatusCode,
			Code:       result.Code,
			Message:    result.Message,
			RequestID:  result.RequestID,
		})
	}
	if len(result.List) != len(commands) {
		return nil, fmt.Errorf(
			"CloudBase database returned %d command results for %d commands",
			len(result.List),
			len(commands),
		)
	}

	return result.List, nil
}

func (c *HTTPClient) WithTransaction(
	ctx context.Context,
	operation func(context.Context) error,
) error {
	const maxAttempts = 8
	var lastError error
	for attempt := 0; attempt < maxAttempts; attempt++ {
		lastError = c.withTransactionOnce(ctx, operation)
		if !errors.Is(lastError, ErrDatabaseConflict) {
			return lastError
		}
		if attempt == maxAttempts-1 {
			break
		}
		if err := waitForTransactionRetry(ctx, attempt); err != nil {
			return err
		}
	}
	return fmt.Errorf("CloudBase database transaction retry exhausted: %w", lastError)
}

func waitForTransactionRetry(ctx context.Context, attempt int) error {
	// Cap the exponential component so a burst of requests remains within the
	// HTTP function deadline. Full jitter prevents all conflicted invocations
	// from retrying the same hot document at the same instant again.
	const baseDelay = 20 * time.Millisecond
	const maxDelay = 500 * time.Millisecond
	delay := baseDelay << attempt
	if delay > maxDelay {
		delay = maxDelay
	}
	delay = time.Duration(rand.Int64N(int64(delay) + 1))

	timer := time.NewTimer(delay)
	defer timer.Stop()
	select {
	case <-ctx.Done():
		return ctx.Err()
	case <-timer.C:
		return nil
	}
}

func (c *HTTPClient) withTransactionOnce(
	ctx context.Context,
	operation func(context.Context) error,
) error {
	transactionID, err := c.startTransaction(ctx)
	if err != nil {
		return err
	}

	transactionContext := context.WithValue(
		ctx,
		transactionContextKey{},
		transactionID,
	)
	if err := operation(transactionContext); err != nil {
		_ = c.finishTransaction(ctx, transactionID, "rollback")
		return err
	}
	if err := c.finishTransaction(ctx, transactionID, "commit"); err != nil {
		_ = c.finishTransaction(ctx, transactionID, "rollback")
		return fmt.Errorf("commit CloudBase database transaction: %w", err)
	}
	return nil
}

func (c *HTTPClient) startTransaction(ctx context.Context) (string, error) {
	body, err := c.do(ctx, http.MethodPost, c.baseURL+"/transactions", nil)
	if err != nil {
		return "", fmt.Errorf("start CloudBase database transaction: %w", err)
	}
	var result struct {
		TransactionID string `json:"transactionId"`
	}
	if err := json.Unmarshal(body, &result); err != nil || strings.TrimSpace(result.TransactionID) == "" {
		return "", errors.New("decode CloudBase database transaction")
	}
	return result.TransactionID, nil
}

func (c *HTTPClient) finishTransaction(
	ctx context.Context,
	transactionID string,
	action string,
) error {
	endpoint := fmt.Sprintf(
		"%s/transactions/%s/%s",
		c.baseURL,
		url.PathEscape(transactionID),
		action,
	)
	_, err := c.do(ctx, http.MethodPost, endpoint, nil)
	return err
}

func (c *HTTPClient) do(
	ctx context.Context,
	method string,
	endpoint string,
	body []byte,
) ([]byte, error) {
	token, err := c.tokenProvider.Token(ctx)
	if err != nil {
		return nil, fmt.Errorf("get CloudBase database credential: %w", err)
	}
	request, err := http.NewRequestWithContext(ctx, method, endpoint, bytes.NewReader(body))
	if err != nil {
		return nil, errors.New("create CloudBase database request")
	}
	request.Header.Set("Authorization", "Bearer "+token)
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Accept", "application/json")

	response, err := c.httpClient.Do(request)
	if err != nil {
		return nil, fmt.Errorf("call CloudBase database: %w", err)
	}
	defer response.Body.Close()
	responseBody, err := io.ReadAll(io.LimitReader(response.Body, 16<<20))
	if err != nil {
		return nil, errors.New("read CloudBase database response")
	}
	if response.StatusCode < http.StatusOK || response.StatusCode >= http.StatusMultipleChoices {
		return nil, decodeAPIError(response.StatusCode, responseBody)
	}
	return responseBody, nil
}

func (c *HTTPClient) Ping(ctx context.Context) error {
	_, err := c.RunCommands(ctx, []any{
		bson.M{"ping": 1},
	}, "")
	return err
}

func marshalExtendedJSON(value any) ([]byte, error) {
	return bson.MarshalExtJSON(value, false, false)
}

func unmarshalExtendedJSON(data []byte, value any) error {
	return bson.UnmarshalExtJSON(data, true, value)
}

func decodeAPIError(statusCode int, body []byte) error {
	var result struct {
		Code      string `json:"code"`
		Message   string `json:"message"`
		RequestID string `json:"requestId"`
	}
	_ = json.Unmarshal(body, &result)

	return mapAPIError(&APIError{
		StatusCode: statusCode,
		Code:       result.Code,
		Message:    result.Message,
		RequestID:  result.RequestID,
	})
}

func mapAPIError(apiError *APIError) error {
	message := strings.ToLower(apiError.Message)
	if apiError.Code == "DATABASE_DUPLICATE_WRITE" ||
		(apiError.Code == "DATABASE_REQUEST_FAILED" &&
			strings.Contains(message, "e11000") &&
			strings.Contains(message, "duplicate key")) {
		return fmt.Errorf("%w: %v", ErrDuplicateWrite, apiError)
	}

	switch apiError.Code {
	case "DOCUMENT_NOT_FOUND":
		return fmt.Errorf("%w: %v", ErrDocumentNotFound, apiError)
	case "DATABASE_TRANSACTION_CONFLICT":
		return fmt.Errorf("%w: %v", ErrDatabaseConflict, apiError)
	default:
		return apiError
	}
}
