package errcode

import "net/http"

type AppError struct {
	HTTPCode int
	Code     int
	Message  string
}

func (e *AppError) Error() string { return e.Message }

func BadRequest(msg string) *AppError {
	return &AppError{http.StatusBadRequest, 400, msg}
}

func NotFound(msg string) *AppError {
	return &AppError{http.StatusNotFound, 404, msg}
}

func Conflict(msg string) *AppError {
	return &AppError{http.StatusConflict, 409, msg}
}

func Internal(msg string) *AppError {
	return &AppError{http.StatusInternalServerError, 500, msg}
}
