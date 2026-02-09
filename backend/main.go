package main

import (
	"net/http"
	"time"

	"github.com/go-playground/validator/v10"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

// Integrar validador con Echo
type CustomValidator struct {
	validator *validator.Validate
}

func (cv *CustomValidator) Validate(i interface{}) error {
	return cv.validator.Struct(i)
}

func main() {
	e := echo.New()

	// Middleware (logs y recuperación de errores)
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())

	// Configuración del validator
	e.Validator = &CustomValidator{validator: validator.New()}

	// Ruta de prueba para el test
	e.GET("/", func(c echo.Context) error {
		return c.String(http.StatusOK, "Hola Exyt")
	})

	// Se crea acreditado
	e.POST("/acreditados", func(c echo.Context) error {
		// Usamos el struct definido en persona.go
		acreditado := new(Acreditado)

		// Juntar los datos
		if err := c.Bind(acreditado); err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, err.Error())
		}

		// Validar campos requeridos
		if err := c.Validate(acreditado); err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, err.Error())
		}

		// Hora del sistema
		now := time.Now().Unix()
		acreditado.Created = now
		acreditado.Modified = now

		return c.JSON(http.StatusCreated, acreditado)
	})

	e.Logger.Fatal(e.Start(":8080"))
}
