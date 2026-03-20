package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"cloud.google.com/go/firestore"
	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/auth"
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

// Middleware de seguridad: se revisa que traigan un token valido
func authMiddleware(client *auth.Client) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			// Se busca la cabecera Authorization
			authHeader := c.Request().Header.Get("Authorization")
			if authHeader == "" {
				return echo.NewHTTPError(http.StatusUnauthorized, "Falta el token de autenticación")
			}

			// Se limpia el string para quitarle el 'Bearer ' del principio
			idToken := strings.TrimSpace(strings.Replace(authHeader, "Bearer", "", 1))

			// Verificamos con Google si el token es real y no ha caducado
			_, err := client.VerifyIDToken(c.Request().Context(), idToken)
			if err != nil {
				return echo.NewHTTPError(http.StatusUnauthorized, "Token invalido o vencido: "+err.Error())
			}

			// Si pasa, seguimos a la siguiente funcion
			return next(c)
		}
	}
}

func main() {
	e := echo.New()

	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{"*"},
		AllowHeaders: []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept, echo.HeaderAuthorization},
		AllowMethods: []string{http.MethodPost, http.MethodGet},
	}))

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

	// *** INICIO CONFIGURACION GOOGLE ***
	ctx := context.Background()

	// Actualizada funcion para buscar las llaves de la BD (sirve para Auth tambien)
	if _, err := os.Stat("llavesBd.json"); err == nil {
		os.Setenv("GOOGLE_APPLICATION_CREDENTIALS", "llavesBd.json")
	}

	// Inicializar la App de Firebase (Necesaria para Auth)
	app, err := firebase.NewApp(ctx, nil)
	if err != nil {
		log.Fatalf("Error arrancando Firebase App: %v\n", err)
	}

	// Cliente de Autenticacion
	authClient, err := app.Auth(ctx)
	if err != nil {
		log.Fatalf("Error arrancando Auth: %v\n", err)
	}

	// Inicializar bd
	client, err := firestore.NewClientWithDatabase(ctx, "pf26-seguis-rafael-lopez", "practicas")
	if err != nil {
		log.Fatalf("Error inicializando firestore: %v\n", err)
	}
	defer client.Close()
	// *** FIN CONFIGURACIÓN ***

	// Rutas publicas (sin proteccion)
	e.GET("/", func(c echo.Context) error {
		return c.String(http.StatusOK, "Hola Exyt")
	})

	// Rutas protegidas (necesitan login)
	// Se crea un grupo para meterle el candado (middleware)
	protegidas := e.Group("")
	protegidas.Use(authMiddleware(authClient))

	protegidas.POST("/acreditados", func(c echo.Context) error {
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

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	e.Logger.Fatal(e.Start(":8080"))
}
