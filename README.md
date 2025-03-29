# api-ollama
Creando una Api para respuestas automaticas de un restaurante.


Para entrenar la inteligencia artificial debes usar este link como POST en postman:

http://localhost:3000/entrenar

Debes enviar este Json en el Body Raw de Postman:

{
  "pregunta": "Tienen hamburguesas de carne?",
  "respuesta": "Si, hoy tenemos promo de 2x1 de hmaburguesa doble de carne"
}



Para obtener las respuestas debes usar este link:

http://localhost:3000/preguntar


Y este body tipo Json en Postman:


{
  "cliente_id": "12345",
  "pregunta": "Que tienen de hamburguesas de carne?"
}
