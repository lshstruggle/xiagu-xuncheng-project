package config

import (
	"fmt"
	"time"

	"github.com/spf13/viper"
)

type Config struct {
	Server  ServerConfig `mapstructure:"server"`
	MongoDB MongoConfig  `mapstructure:"mongodb"`
	Redis   RedisConfig  `mapstructure:"redis"`
	WeChat  WeChatConfig `mapstructure:"wechat"`
	JWT     JWTConfig    `mapstructure:"jwt"`
	Yuanqi  YuanqiConfig `mapstructure:"yuanqi"`
	TTS     TTSConfig    `mapstructure:"tts"`
	LBS     LBSConfig    `mapstructure:"lbs"`
}

type ServerConfig struct {
	Port                int      `mapstructure:"port"`
	Mode                string   `mapstructure:"mode"`
	AllowedAdminOrigins []string `mapstructure:"allowed_admin_origins"`
}

type MongoConfig struct {
	URI              string        `mapstructure:"uri"`
	Database         string        `mapstructure:"database"`
	CollectionPrefix string        `mapstructure:"collection_prefix"`
	MaxPoolSize      uint64        `mapstructure:"max_pool_size"`
	MinPoolSize      uint64        `mapstructure:"min_pool_size"`
	ConnectTimeout   time.Duration `mapstructure:"connect_timeout"`
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
	BatchSize         int     `mapstructure:"batch_size"`
	SampleSteps       int     `mapstructure:"sample_steps"`
	SplitInterval     float64 `mapstructure:"split_interval"`
	Speed             float64 `mapstructure:"speed"`
	TopK              int     `mapstructure:"top_k"`
	TopP              float64 `mapstructure:"top_p"`
	Temperature       float64 `mapstructure:"temperature"`
	RepetitionPenalty float64 `mapstructure:"repetition_penalty"`
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
	v := viper.New()
	v.AutomaticEnv()
	setServerlessDefaults(v)

	if err := bindCloudEnvironment(v); err != nil {
		return err
	}

	if path != "" {
		v.SetConfigFile(path)

		if err := v.ReadInConfig(); err != nil {
			return fmt.Errorf("read config: %w", err)
		}
	}

	loadedConfig := &Config{}
	if err := v.Unmarshal(loadedConfig); err != nil {
		return fmt.Errorf("decode config: %w", err)
	}

	C = loadedConfig
	return nil
}

func bindCloudEnvironment(v *viper.Viper) error {
	bindings := []struct {
		configKey string
		envKey    string
	}{
		{configKey: "server.mode", envKey: "SERVER_MODE"},
		{configKey: "server.allowed_admin_origins", envKey: "ALLOWED_ADMIN_ORIGINS"},

		{configKey: "mongodb.uri", envKey: "MONGODB_URI"},
		{configKey: "mongodb.database", envKey: "MONGODB_DATABASE"},
		{configKey: "mongodb.collection_prefix", envKey: "MONGODB_COLLECTION_PREFIX"},

		{configKey: "wechat.app_id", envKey: "WECHAT_APP_ID"},
		{configKey: "wechat.app_secret", envKey: "WECHAT_APP_SECRET"},

		{configKey: "jwt.secret", envKey: "JWT_SECRET"},

		{configKey: "yuanqi.base_url", envKey: "YUANQI_BASE_URL"},
		{configKey: "yuanqi.token", envKey: "YUANQI_TOKEN"},
		{configKey: "yuanqi.assistant_id", envKey: "YUANQI_ASSISTANT_ID"},
	}

	for _, binding := range bindings {
		if err := v.BindEnv(binding.configKey, binding.envKey); err != nil {
			return fmt.Errorf(
				"bind environment variable %s: %w",
				binding.envKey,
				err,
			)
		}
	}

	return nil
}

func setServerlessDefaults(v *viper.Viper) {
	v.SetDefault("server.port", 9000)
	v.SetDefault("server.mode", "release")

	v.SetDefault("mongodb.max_pool_size", 10)
	v.SetDefault("mongodb.min_pool_size", 0)
	v.SetDefault("mongodb.connect_timeout", 10*time.Second)

	v.SetDefault("jwt.expire_hours", 168)

	v.SetDefault("yuanqi.timeout", 15*time.Second)
	v.SetDefault("yuanqi.max_retries", 2)

	v.SetDefault("lbs.default_trigger_radius", 80)
	v.SetDefault("lbs.distance_tolerance", 1.2)
	v.SetDefault("lbs.checkin_cooldown", 86400)
}
