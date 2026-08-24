package repository

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"xiagu-server/internal/database"
)

func TestExchangeShopItemCommitsOwnershipAndBalance(t *testing.T) {
	commandNumber := 0
	committed := false
	server := httptest.NewServer(http.HandlerFunc(func(
		writer http.ResponseWriter,
		request *http.Request,
	) {
		writer.Header().Set("Content-Type", "application/json")
		switch {
		case strings.HasSuffix(request.URL.Path, "/transactions"):
			writer.WriteHeader(http.StatusCreated)
			_, _ = writer.Write([]byte(`{"transactionId":"shop-tx"}`))
		case strings.HasSuffix(request.URL.Path, "/commands"):
			commandNumber++
			var body map[string]any
			if err := json.NewDecoder(request.Body).Decode(&body); err != nil {
				t.Fatalf("decode command: %v", err)
			}
			encoded, _ := json.Marshal(body["commands"])
			switch commandNumber {
			case 1:
				if body["transactionId"] != "shop-tx" {
					t.Fatalf("missing transaction ID: %#v", body)
				}
				if !strings.Contains(string(encoded), "test_user_inventory") ||
					!strings.Contains(string(encoded), "507f1f77bcf86cd799439011:h_gongsun") {
					t.Fatalf("unexpected inventory command: %s", encoded)
				}
				_, _ = writer.Write([]byte(`{"list":[[{"n":{"$numberInt":"1"}}]]}`))
			case 2:
				if body["transactionId"] != "shop-tx" {
					t.Fatalf("missing transaction ID: %#v", body)
				}
				if !strings.Contains(string(encoded), "hero_fragments") ||
					!strings.Contains(string(encoded), "$gte") {
					t.Fatalf("unexpected balance command: %s", encoded)
				}
				_, _ = writer.Write([]byte(`{"list":[[{"n":{"$numberInt":"1"},"nModified":{"$numberInt":"1"}}]]}`))
			case 3:
				if _, exists := body["transactionId"]; exists {
					t.Fatalf("committed balance read must be outside transaction: %#v", body)
				}
				_, _ = writer.Write([]byte(`{"list":[[{"hero_fragments":{"$numberInt":"42"},"skin_fragments":{"$numberInt":"7"}}]]}`))
			default:
				t.Fatalf("unexpected command number %d", commandNumber)
			}
		case strings.HasSuffix(request.URL.Path, "/commit"):
			committed = true
			writer.WriteHeader(http.StatusNoContent)
		default:
			t.Fatalf("unexpected request %s", request.URL.Path)
		}
	}))
	defer server.Close()

	repo := newShopTestUserRepo(t, server.URL)
	hero, skin, err := repo.ExchangeShopItem(
		context.Background(),
		"507f1f77bcf86cd799439011",
		ShopExchange{ItemID: "h_gongsun", ItemType: "hero", HeroID: "gongsun", Cost: 58},
	)
	if err != nil {
		t.Fatalf("exchange item: %v", err)
	}
	if hero != 42 || skin != 7 || !committed {
		t.Fatalf("exchange result = (%d, %d, committed=%t)", hero, skin, committed)
	}
}

func TestExchangeShopItemRollsBackInsufficientBalance(t *testing.T) {
	commandNumber := 0
	rolledBack := false
	server := httptest.NewServer(http.HandlerFunc(func(
		writer http.ResponseWriter,
		request *http.Request,
	) {
		writer.Header().Set("Content-Type", "application/json")
		switch {
		case strings.HasSuffix(request.URL.Path, "/transactions"):
			writer.WriteHeader(http.StatusCreated)
			_, _ = writer.Write([]byte(`{"transactionId":"shop-tx"}`))
		case strings.HasSuffix(request.URL.Path, "/commands"):
			commandNumber++
			if commandNumber == 1 {
				_, _ = writer.Write([]byte(`{"list":[[{"n":{"$numberInt":"1"}}]]}`))
				return
			}
			_, _ = writer.Write([]byte(`{"list":[[{"n":{"$numberInt":"0"},"nModified":{"$numberInt":"0"}}]]}`))
		case strings.HasSuffix(request.URL.Path, "/rollback"):
			rolledBack = true
			writer.WriteHeader(http.StatusNoContent)
		default:
			t.Fatalf("unexpected request %s", request.URL.Path)
		}
	}))
	defer server.Close()

	repo := newShopTestUserRepo(t, server.URL)
	_, _, err := repo.ExchangeShopItem(
		context.Background(),
		"507f1f77bcf86cd799439011",
		ShopExchange{ItemID: "h_gongsun", ItemType: "hero", Cost: 58},
	)
	if !errors.Is(err, ErrInsufficientAssets) || !rolledBack {
		t.Fatalf("expected insufficient balance rollback, got %v (rollback=%t)", err, rolledBack)
	}
}

func TestExchangeShopItemRollsBackDuplicateOwnership(t *testing.T) {
	rolledBack := false
	server := httptest.NewServer(http.HandlerFunc(func(
		writer http.ResponseWriter,
		request *http.Request,
	) {
		writer.Header().Set("Content-Type", "application/json")
		switch {
		case strings.HasSuffix(request.URL.Path, "/transactions"):
			writer.WriteHeader(http.StatusCreated)
			_, _ = writer.Write([]byte(`{"transactionId":"shop-tx"}`))
		case strings.HasSuffix(request.URL.Path, "/commands"):
			_, _ = writer.Write([]byte(`{"code":"DATABASE_REQUEST_FAILED","message":"E11000 duplicate key error","list":[]}`))
		case strings.HasSuffix(request.URL.Path, "/rollback"):
			rolledBack = true
			writer.WriteHeader(http.StatusNoContent)
		default:
			t.Fatalf("unexpected request %s", request.URL.Path)
		}
	}))
	defer server.Close()

	repo := newShopTestUserRepo(t, server.URL)
	_, _, err := repo.ExchangeShopItem(
		context.Background(),
		"507f1f77bcf86cd799439011",
		ShopExchange{ItemID: "h_gongsun", ItemType: "hero", Cost: 58},
	)
	if !errors.Is(err, ErrItemAlreadyOwned) || !rolledBack {
		t.Fatalf("expected duplicate ownership rollback, got %v (rollback=%t)", err, rolledBack)
	}
}

func newShopTestUserRepo(t *testing.T, baseURL string) *UserRepo {
	t.Helper()
	client, err := database.NewHTTPClient(database.HTTPClientConfig{
		EnvironmentID: "test-env",
		BaseURL:       baseURL,
	}, database.StaticToken("test-key"))
	if err != nil {
		t.Fatalf("create database client: %v", err)
	}
	return NewUserRepo(database.NewCollections(client, "test_"))
}
