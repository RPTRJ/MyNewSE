package services

import (
	"crypto/tls"
	"fmt"
	"os"
	"strconv"

	"gopkg.in/gomail.v2"
)

type EmailService struct {
	dialer *gomail.Dialer
	from   string
}

func NewEmailService() *EmailService {
	host := os.Getenv("SMTP_HOST")
	if host == "" {
		host = "smtp.gmail.com"
	}

	portStr := os.Getenv("SMTP_PORT")
	if portStr == "" {
		portStr = "587"
	}
	port, _ := strconv.Atoi(portStr)

	user := os.Getenv("SMTP_USER")
	password := os.Getenv("SMTP_PASSWORD")
	from := os.Getenv("SMTP_FROM")
	if from == "" {
		from = "MySE Portfolio <noreply@localhost>"
	}

	// If SMTP credentials are not provided, do not attempt to connect to SMTP
	// server in development — just log the reset link instead.
	if user == "" || password == "" {
		return &EmailService{
			dialer: nil,
			from:   from,
		}
	}

	d := gomail.NewDialer(host, port, user, password)
	d.TLSConfig = &tls.Config{InsecureSkipVerify: true}

	return &EmailService{
		dialer: d,
		from:   from,
	}
}

func (s *EmailService) SendPasswordResetEmail(to, resetLink string) error {
	m := gomail.NewMessage()
	m.SetHeader("From", s.from)
	m.SetHeader("To", to)
	m.SetHeader("Subject", "รีเซ็ตรหัสผ่าน - MySE Portfolio")

	body := fmt.Sprintf(`
    <html>
    <body style="font-family: Arial, sans-serif; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 30px; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #e66a0a; margin: 0;">MySE Portfolio</h1>
            </div>
            
            <h2 style="color: #333;">คำขอรีเซ็ตรหัสผ่าน</h2>
            <p style="color: #666; line-height: 1.6;">
                คุณได้ขอรีเซ็ตรหัสผ่านสำหรับบัญชี MySE Portfolio ของคุณ
            </p>
            <p style="color: #666; line-height: 1.6;">
                กรุณาคลิกปุ่มด้านล่างเพื่อรีเซ็ตรหัสผ่าน (ลิงค์มีอายุ 15 นาที):
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="%s" style="background-color: #e66a0a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                    รีเซ็ตรหัสผ่าน
                </a>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
                หรือคัดลอกลิงค์นี้ไปวางในเบราว์เซอร์:
            </p>
            <p style="background-color: #eee; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 12px;">
                %s
            </p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
            
            <p style="color: #999; font-size: 12px; line-height: 1.6;">
                <strong>หมายเหตุ:</strong><br>
                • ลิงค์นี้จะหมดอายุภายใน 15 นาที<br>
                • ลิงค์นี้สามารถใช้ได้เพียงครั้งเดียวเท่านั้น<br>
                • หากคุณไม่ได้ขอรีเซ็ตรหัสผ่าน กรุณาเพิกเฉยอีเมลนี้
            </p>
        </div>
    </body>
    </html>
    `, resetLink, resetLink)

	m.SetBody("text/html", body)

	// If dialer is nil (no SMTP configured), log the email and return nil
	if s.dialer == nil {
		fmt.Printf("[DEV] Password reset for %s: %s\n", to, resetLink)
		return nil
	}

	return s.dialer.DialAndSend(m)
}
