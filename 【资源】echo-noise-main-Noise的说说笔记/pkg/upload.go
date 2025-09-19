package pkg

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/lin-snow/ech0/config"
	"github.com/lin-snow/ech0/internal/models"
)

// 上传图片并返回图片的URL
func UploadImage(c *gin.Context, allowedExtensions []string) (string, error) {
	// 获取上传的文件
	file, err := c.FormFile("image")
	if err != nil {
		return "", errors.New(models.NotUploadImageErrorMessage)
	}

	// 检查图片类型是否合法
	if !isAllowedType(file.Header.Get("Content-Type"), allowedExtensions) {
		return "", errors.New(models.NotSupportedImageTypeMessage)
	}

	// 检查文件大小
	if file.Size > int64(config.Config.Upload.MaxSize) {
		return "", errors.New(models.ImageSizeLimitErrorMessage + strconv.Itoa(config.Config.Upload.MaxSize/1024/1024) + "MB")
	}

	// 创建存储图片的目录（如果没有的话）
	if err := createImageDirIfNotExist(config.Config.Upload.SavePath); err != nil {
		return "", err
	}

	// 获取原始文件名和扩展名
	ext := filepath.Ext(file.Filename)
	baseName := strings.TrimSuffix(file.Filename, ext)

	// 使用 UUID 和原始文件名生成新的文件名
	newFileName := fmt.Sprintf("%s_%s%s", baseName, uuid.New().String(), ext)

	// 保存文件到指定目录
	savePath := filepath.Join(config.Config.Upload.SavePath, newFileName)
	if err := c.SaveUploadedFile(file, savePath); err != nil {
		fmt.Println(savePath)
		return "", errors.New(models.ImageUploadErrorMessage)
	}

	// 返回图片的 URL
	imageURL := fmt.Sprintf("/images/%s", newFileName)
	return imageURL, nil
}

// 检查文件类型是否合法
func isAllowedType(contentType string, allowedTypes []string) bool {
	fmt.Println(contentType)
	fmt.Println(allowedTypes)
	for _, allowed := range allowedTypes {
		if contentType == allowed {
			return true
		}
	}
	return false
}

// 创建存储图片的目录
func createImageDirIfNotExist(imagePath string) error {
	if _, err := os.Stat(imagePath); os.IsNotExist(err) {
		if err := os.MkdirAll(imagePath, os.ModePerm); err != nil {
			return err
		}
	}
	return nil
}

// 上传视频并返回视频的URL
func UploadVideo(c *gin.Context, allowedExtensions []string) (string, error) {
	// 获取上传的文件
	file, err := c.FormFile("video")
	if err != nil {
		return "", errors.New("未上传视频文件")
	}

	// 检查视频类型是否合法
	if !isAllowedType(file.Header.Get("Content-Type"), allowedExtensions) {
		return "", errors.New("不支持的视频类型")
	}

	// 检查文件大小（200MB）
	if file.Size > 200*1024*1024 {
		return "", errors.New("视频大小不能超过200MB")
	}

	// 创建存储视频的目录
	videoPath := "/app/data/video"
	if err := createImageDirIfNotExist(videoPath); err != nil {
		return "", err
	}

	ext := filepath.Ext(file.Filename)
	baseName := strings.TrimSuffix(file.Filename, ext)
	newFileName := fmt.Sprintf("%s_%s%s", baseName, uuid.New().String(), ext)
	savePath := filepath.Join(videoPath, newFileName)
	if err := c.SaveUploadedFile(file, savePath); err != nil {
		return "", errors.New("视频上传失败")
	}

	videoURL := fmt.Sprintf("/video/%s", newFileName)
	return videoURL, nil
}