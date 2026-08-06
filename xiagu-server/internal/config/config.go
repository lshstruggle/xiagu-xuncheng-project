package config

import (
	"time"

	"github.com/spf13/viper"
)

type Config struct {
	Server  ServerConfig  `mapstructure:"server"`
	MongoDB MongoConfig   `mapstructure:"mongodb"`
	Redis   RedisConfig   `mapstructure:"redis"`
	WeChat  WeChatConfig  `mapstructure:"wechat"`
	JWT     JWTConfig     `mapstructure:"jwt"`
	Yuanqi  YuanqiConfig  `mapstructure:"yuanqi"`
	TTS     TTSConfig     `mapstructure:"tts"`
	LBS     LBSConfig     `mapstructure:"lbs"`
}

type ServerConfig struct {
	Port int    `mapstructure:"port"`
	Mode string `mapstructure:"mode"`
}

type MongoConfig struct {
	URI            string        `mapstructure:"uri"`
	Database       string        `mapstructure:"database"`
	MaxPoolSize    uint64        `mapstructure:"max_pool_size"`
	MinPoolSize    uint64        `mapstructure:"min_pool_size"`
	ConnectTimeout time.Duration `mapstructure:"connect_timeout"`
}

type RedisConfig struct {
	Addr     string `mapstructure:"addr"`
	Password string `mapstructure:"password"`
	DB       int    `mapstructure:"db"`
	PoolSize int    `mapstructure:"pool_size"`
}

type WeChatConfig struct {
	AppID     string `mapstructure:"app_id"`
	AppSecret string `mapstructure:"app_secret"`
}

type JWTConfig struct {
	Secret      string `mapstructure:"secret"`
	ExpireHours int    `mapstructure:"expire_hours"`
}

type YuanqiConfig struct {
	BaseURL     string        `mapstructure:"base_url"`
	Token       string        `mapstructure:"token"`
	AssistantID string        `mapstructure:"assistant_id"`
	Timeout     time.Duration `mapstructure:"timeout"`
	MaxRetries  int           `mapstructure:"max_retries"`
}

// InferenceParams GPT-SoVITS推理参数
type InferenceParams struct {
	BatchSize          int     `mapstructure:"batch_size"`
	SampleSteps        int     `mapstructure:"sample_steps"`
	SplitInterval      float64 `mapstructure:"split_interval"`
	Speed              float64 `mapstructure:"speed"`
	TopK               int     `mapstructure:"top_k"`
	TopP               float64 `mapstructure:"top_p"`
	Temperature        float64 `mapstructure:"temperature"`
	RepetitionPenalty  float64 `mapstructure:"repetition_penalty"`
}

type TTSConfig struct {
	BaseURL        string          `mapstructure:"base_url"`
	Timeout        time.Duration   `mapstructure:"timeout"`
	CacheDir       string          `mapstructure:"cache_dir"`
	SovitsModel    string          `mapstructure:"sovits_model_path"`
	GPTModel       string          `mapstructure:"gpt_model_path"`
	ReferenceAudio string          `mapstructure:"reference_audio"`
	ReferenceText  string          `mapstructure:"reference_text"`
	Inference      InferenceParams `mapstructure:"inference_params"`
}

type LBSConfig struct {
	DefaultTriggerRadius int     `mapstructure:"default_trigger_radius"`
	DistanceTolerance    float64 `mapstructure:"distance_tolerance"`
	CheckinCooldown      int     `mapstructure:"checkin_cooldown"`
}

var C *Config

func Load(path string) error {
	viper.SetConfigFile(path)
	viper.AutomaticEnv()

	if err := viper.ReadInConfig(); err != nil {
		return err
	}

	C = &Config{}
	return viper.Unmarshal(C)
}
