package main

import (
	"encoding/json"
	"log"
	"net/http"
)

func main() {
	http.HandleFunc("/health", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{
			"status":  "ok",
			"service": "xiagu-api-cli-smoke",
		})
	})

	log.Print("xiagu-api-cli-smoke listening on 0.0.0.0:9000")
	log.Fatal(http.ListenAndServe("0.0.0.0:9000", nil))
}
