package logger

import (
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

var Log *zap.SugaredLogger

func Init(mode string) {
	var cfg zap.Config
	if mode == "release" {
		cfg = zap.NewProductionConfig()
	} else {
		cfg = zap.NewDevelopmentConfig()
		cfg.EncoderConfig.EncodeLevel = zapcore.CapitalColorLevelEncoder
	}

	l, _ := cfg.Build()
	Log = l.Sugar()
}

func Info(msg string, args ...interface{})  { Log.Infof(msg, args...) }
func Warn(msg string, args ...interface{})  { Log.Warnf(msg, args...) }
func Error(msg string, args ...interface{}) { Log.Errorf(msg, args...) }
