package service

import "testing"

func TestBondLevel(t *testing.T) {
	tests := []struct {
		bondValue int
		want      int
	}{
		{bondValue: -1, want: 1},
		{bondValue: 0, want: 1},
		{bondValue: 199, want: 1},
		{bondValue: 200, want: 2},
		{bondValue: 1799, want: 9},
		{bondValue: 1800, want: 10},
		{bondValue: 9999, want: 10},
	}
	for _, test := range tests {
		if got := BondLevel(test.bondValue); got != test.want {
			t.Errorf("BondLevel(%d) = %d, want %d", test.bondValue, got, test.want)
		}
	}
}
