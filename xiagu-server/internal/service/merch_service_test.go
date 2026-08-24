package service

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"xiagu-server/internal/database"
	"xiagu-server/internal/model"
	"xiagu-server/internal/repository"
	"xiagu-server/pkg/errcode"
)

const merchTestUserID = "507f1f77bcf86cd799439011"

func TestMerchOrderRejectsInvalidPrivateContactDataBeforeDatabase(t *testing.T) {
	service := NewMerchService(&repository.Repos{})
	order := &model.MerchOrder{
		HeroID:  "libai",
		Name:    "李",
		Phone:   "123456",
		Address: "短地址",
	}
	err := service.SubmitOrder(context.Background(), merchTestUserID, order)
	var applicationError *errcode.AppError
	if !errors.As(err, &applicationError) || applicationError.Code != 400 {
		t.Fatalf("expected invalid contact data, got %v", err)
	}
}

func TestMerchOrderRejectsIneligibleBond(t *testing.T) {
	server := newMerchTestServer(t, 1799, false)
	defer server.Close()

	service := NewMerchService(newMerchTestRepos(t, server.URL))
	err := service.SubmitOrder(context.Background(), merchTestUserID, validMerchOrder())
	var applicationError *errcode.AppError
	if !errors.As(err, &applicationError) || applicationError.Code != 409 {
		t.Fatalf("expected bond eligibility conflict, got %v", err)
	}
}

func TestMerchOrderPersistsEligibleClaimWithoutLoggingContactData(t *testing.T) {
	server := newMerchTestServer(t, 1800, false)
	defer server.Close()

	service := NewMerchService(newMerchTestRepos(t, server.URL))
	order := validMerchOrder()
	if err := service.SubmitOrder(context.Background(), merchTestUserID, order); err != nil {
		t.Fatalf("submit eligible order: %v", err)
	}
	if order.ID.IsZero() || order.Status != "pending" || order.UserID != merchTestUserID {
		t.Fatalf("unexpected persisted order: %#v", order)
	}
}

func TestMerchOrderRejectsDuplicateHeroClaim(t *testing.T) {
	server := newMerchTestServer(t, 1800, true)
	defer server.Close()

	service := NewMerchService(newMerchTestRepos(t, server.URL))
	err := service.SubmitOrder(context.Background(), merchTestUserID, validMerchOrder())
	var applicationError *errcode.AppError
	if !errors.As(err, &applicationError) || applicationError.Code != 409 {
		t.Fatalf("expected duplicate claim conflict, got %v", err)
	}
}

func validMerchOrder() *model.MerchOrder {
	return &model.MerchOrder{
		HeroID:  "libai",
		Name:    "测试用户",
		Phone:   "13800138000",
		Address: "四川省成都市测试区测试路一号",
	}
}

func newMerchTestRepos(t *testing.T, baseURL string) *repository.Repos {
	t.Helper()
	client, err := database.NewHTTPClient(database.HTTPClientConfig{
		EnvironmentID: "test-env",
		BaseURL:       baseURL,
	}, database.StaticToken("test-key"))
	if err != nil {
		t.Fatalf("create database client: %v", err)
	}
	return repository.NewRepos(database.NewCollections(client, "test_"))
}

func newMerchTestServer(
	t *testing.T,
	bondValue int,
	duplicate bool,
) *httptest.Server {
	t.Helper()
	return httptest.NewServer(http.HandlerFunc(func(
		writer http.ResponseWriter,
		request *http.Request,
	) {
		writer.Header().Set("Content-Type", "application/json")
		var body struct {
			Commands []map[string]any `json:"commands"`
		}
		if err := json.NewDecoder(request.Body).Decode(&body); err != nil {
			t.Fatalf("decode database command: %v", err)
		}
		if len(body.Commands) != 1 {
			t.Fatalf("unexpected commands: %#v", body.Commands)
		}
		command := body.Commands[0]
		switch {
		case command["find"] == "test_users":
			_, _ = writer.Write([]byte(`{"list":[[{"_id":{"$oid":"` +
				merchTestUserID + `"},"hero_bonds":{"libai":{"bond_value":{"$numberInt":"` +
				intString(bondValue) + `"}}}}]]}`))
		case command["insert"] == "test_merch_orders":
			encoded, _ := json.Marshal(command)
			if strings.Contains(string(encoded), "test-key") {
				t.Fatal("database command must never contain credentials")
			}
			if duplicate {
				_, _ = writer.Write([]byte(
					`{"code":"DATABASE_REQUEST_FAILED","message":"E11000 duplicate key error"}`,
				))
				return
			}
			_, _ = writer.Write([]byte(`{"list":[[{"n":{"$numberInt":"1"}}]]}`))
		default:
			t.Fatalf("unexpected command: %#v", command)
		}
	}))
}

func intString(value int) string {
	if value == 0 {
		return "0"
	}
	digits := make([]byte, 0, 10)
	for value > 0 {
		digits = append(digits, byte('0'+value%10))
		value /= 10
	}
	for left, right := 0, len(digits)-1; left < right; left, right = left+1, right-1 {
		digits[left], digits[right] = digits[right], digits[left]
	}
	return string(digits)
}
