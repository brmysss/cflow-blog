package config

import (
	"log"

	"github.com/spf13/viper"
)

type AppConfig struct {
    Server struct {
        Port string `yaml:"port"`
        Host string `yaml:"host"`
        Mode string `yaml:"mode"`
    } `yaml:"server"`
    Database struct {
        Type     string `yaml:"type"`
        Path     string `yaml:"path"`     // SQLite 专用
        Host     string `yaml:"host"`     // PostgreSQL/MySQL
        Port     string `yaml:"port"`     // PostgreSQL/MySQL
        User     string `yaml:"user"`     // PostgreSQL/MySQL
        Password string `yaml:"password"` // PostgreSQL/MySQL
        DBName   string `yaml:"dbname"`   // PostgreSQL/MySQL
    } `yaml:"database"`
    Upload struct {
        MaxSize      int      `yaml:"maxsize"`
        AllowedTypes []string `yaml:"allowedtypes"`
        SavePath     string   `yaml:"savepath"`
    } `yaml:"upload"`
    Auth struct {
        Jwt struct {
            Secret   string `yaml:"secret"`
            Expires  int    `yaml:"expires"`
            Issuer   string `yaml:"issuer"`
            Audience string `yaml:"audience"`
        } `yaml:"jwt"`
    } `yaml:"auth"`
}

var Config AppConfig

func LoadConfig() error {
	viper.SetConfigFile("config/config.yaml")
	viper.SetConfigType("yaml")

	err := viper.ReadInConfig()
	if err != nil {
		log.Printf("Failed to load config: %s", err)
		return err
	}

	err = viper.Unmarshal(&Config)
	if err != nil {
		log.Printf("Failed to parse config: %s", err)
		return err
	}

	return nil
}
