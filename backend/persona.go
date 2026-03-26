package main

type Acreditado struct {
	//Se supone que fronted no envia id, pero backend si debe responder con uno
	ID string `json:"id,omitempty" firestore:"-"`

	//Datos de la persona (Foto opcional)
	Nombre    string `json:"nombre" firestore:"nombre" validate:"required"`
	Apellidos string `json:"apellidos" firestore:"apellidos" validate:"required"`
	Email     string `json:"email" firestore:"email" validate:"required"`
	DNI       string `json:"dni" firestore:"dni" validate:"required"`
	Empresa   string `json:"empresa" firestore:"empresa" validate:"required"`
	Foto      string `json:"foto,omitempty" firestore:"foto,omitempty"`
	Fecha     string `json:"fecha" firestore:"fecha" validate:"required"`
	//Variables de creacion y modificacion
	Created  int64 `json:"created" firestore:"created"`
	Modified int64 `json:"modified" firestore:"modified"`
}
