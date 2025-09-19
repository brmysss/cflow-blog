package services

import (
	"errors"
    "fmt"
    "github.com/lin-snow/ech0/internal/dto"
    "github.com/lin-snow/ech0/internal/models"
    "github.com/lin-snow/ech0/internal/repository"
    "github.com/lin-snow/ech0/pkg"
)

func Register(userdto dto.RegisterDto) error {
	if userdto.Username == "" || userdto.Password == "" {
		return errors.New(models.UsernameOrPasswordCannotBeEmptyMessage)
	}

	userdto.Password = pkg.MD5Encrypt(userdto.Password)

	newuser := models.User{
		Username: userdto.Username,
		Password: userdto.Password,
		IsAdmin:  false,
		Token:    models.GenerateToken(32),
	}

	user, err := repository.GetUserByUsername(userdto.Username)
	if err == nil && user != nil && user.ID != 0 {
		return errors.New(models.UsernameAlreadyExistsMessage)
	}

	users, err := repository.GetAllUsers()
	if err != nil {
		return errors.New(models.GetAllUsersFailMessage)
	}
	if len(users) == 0 {
		newuser.IsAdmin = true
	}

	if err := repository.CreateUser(&newuser); err != nil {
		return errors.New(models.CreateUserFailMessage)
	}

	return nil
}

func Login(userdto dto.LoginDto) (*models.User, error) {
    if userdto.Username == "" || userdto.Password == "" {
        return nil, errors.New(models.UsernameOrPasswordCannotBeEmptyMessage)
    }

    userdto.Password = pkg.MD5Encrypt(userdto.Password)

    user, err := repository.GetUserByUsername(userdto.Username)
    if err != nil {
        return nil, errors.New(models.UserNotFoundMessage)
    }

    if user.Password != userdto.Password {
        return nil, errors.New(models.PasswordIncorrectMessage)
    }

    // 只在 token 为空时生成新的 token
    if user.Token == "" {
        user.Token = models.GenerateToken(32)
        if err := repository.UpdateUser(user); err != nil {
            return nil, fmt.Errorf("生成用户 token 失败: %v", err)
        }
    }

    return user, nil
}

func GetStatus() (models.Status, error) {
    sysuser, err := repository.GetSysAdmin()
    if err != nil {
        return models.Status{}, errors.New(models.UserNotFoundMessage)
    }

    var users []models.UserStatus
    allusers, err := repository.GetAllUsers()
    if err != nil {
        return models.Status{}, errors.New(models.GetAllUsersFailMessage)
    }
    for _, user := range allusers {
        users = append(users, models.UserStatus{
            ID:       user.ID,
            Username: user.Username,
            IsAdmin:  user.IsAdmin,
        })
    }

	status := models.Status{}

	messages, err := repository.GetAllMessages(true)
	if err != nil {
		return status, errors.New(models.GetAllMessagesFailMessage)
	}

	status.SysAdminID = sysuser.ID
	status.Username = sysuser.Username
	status.Users = users
	status.TotalMessages = len(messages)

	return status, nil
}

func GetUserByID(userID uint) (*models.User, error) {
	user, err := repository.GetUserByID(userID)
	if err != nil {
		return nil, errors.New(models.UserNotFoundMessage)
	}
	return user, nil
}

func IsUserAdmin(userID uint) (bool, error) {
	user, err := repository.GetUserByID(userID)
	if err != nil {
		return false, errors.New(models.UserNotFoundMessage)
	}
	return user.IsAdmin, nil
}

func UpdateUser(user *models.User, userdto dto.UserInfoDto) error {
	if user.Username == userdto.Username {
		return nil
	}

	if userdto.Username == "" {
		return errors.New(models.UsernameCannotBeEmptyMessage)
	}

	user.Username = userdto.Username
	if err := repository.UpdateUser(user); err != nil {
		return errors.New(err.Error())
	}

	return nil
}

func ChangePassword(user *models.User, userdto dto.UserInfoDto) error {
    if user == nil {
        return errors.New("用户信息不能为空")
    }

    if userdto.Password == "" {
        return errors.New(models.PasswordCannotBeEmptyMessage)
    }

    newPassword := pkg.MD5Encrypt(userdto.Password)
    if user.Password == newPassword {
        return errors.New(models.PasswordCannotBeSameAsBeforeMessage)
    }

    user.Password = newPassword
    // 修改密码时不更新 token
    
    if err := repository.UpdateUser(user); err != nil {
        return fmt.Errorf("更新密码失败: %v", err)
    }

    return nil
}

func UpdateUserAdmin(userID uint) error {
	user, err := repository.GetUserByID(userID)
	if err != nil {
		return err
	}

	user.IsAdmin = !user.IsAdmin

	if err := repository.UpdateUser(user); err != nil {
		return err
	}

	return nil
}