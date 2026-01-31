package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"cloud.google.com/go/firestore"
	"github.com/go-playground/validator/v10"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

// CustomValidator integra el validador con Echo
type CustomValidator struct {
	validator *validator.Validate
}

func (cv *CustomValidator) Validate(i interface{}) error {
	return cv.validator.Struct(i)
}

func main() {
	e := echo.New()

	// Middleware
	e.Use(middleware.RequestLoggerWithConfig(middleware.RequestLoggerConfig{
		LogStatus: true,
		LogURI:    true,
		LogMethod: true,
		LogError:  true,
		LogValuesFunc: func(c echo.Context, v middleware.RequestLoggerValues) error {
			log.Printf("REQUEST: method=%v uri=%v status=%v error=%v\n", v.Method, v.URI, v.Status, v.Error)
			return nil
		},
	}))
	e.Use(middleware.Recover())

	e.Validator = &CustomValidator{validator: validator.New()}

	// *** INICIO CONFIGURACION FIRESTORE ***
	ctx := context.Background()

	//Actualizada funcion para buscar las llaves de la BD
	os.Setenv("GOOGLE_APPLICATION_CREDENTIALS", "llavesBd.json")

	// Inicializar bd
	client, err := firestore.NewClientWithDatabase(ctx, "pf26-seguis-rafael-lopez", "practicas")
	if err != nil {
		log.Fatalf("Error inicializando firestore: %v\n", err)
	}
	defer client.Close()
	// *** FIN CONFIGURACIÓN FIRESTORE ***

	e.GET("/", func(c echo.Context) error {
		return c.String(http.StatusOK, "Hola Exyt")
	})

	e.POST("/acreditados", func(c echo.Context) error {
		acreditado := new(Acreditado)

		if err := c.Bind(acreditado); err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, err.Error())
		}

		if err := c.Validate(acreditado); err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, err.Error())
		}

		now := time.Now().Unix()
		acreditado.Created = now
		acreditado.Modified = now

		ref, _, err := client.Collection("acreditado").Add(ctx, acreditado)
		if err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, "Error guardando en BBDD: "+err.Error())
		}

		acreditado.ID = ref.ID

		return c.JSON(http.StatusCreated, acreditado)
	})

	e.Logger.Fatal(e.Start(":8080"))
}
