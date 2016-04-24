# Rubber Duck debugger
Rubber duck debugging is an informal term used in software engineering for a method of debugging code. The name is a reference to a story in the book The Pragmatic Programmer in which a programmer would carry around a rubber duck and debug their code by forcing themselves to explain it, line-by-line, to the duck.
___
## GET /dialog
#### parameters
| parameter | type | description |
| --- | --- | --- |
| duck_id | string | Unique identifier for the duck session.
| answer | string | *(optional)* User answer to the last duck question. There are some special commands:
| | |  - reset: Starts all over. Clears the dialog history.
| | |  - *empty*: Repeats the las question.

#### response
| field | type | description |
| --- | --- | --- |
| next_question | string | Duck question for the user.
| answer_type | number | It could be one this:
| | | 3: Then next answer is probably going to be a long one.
| | | 2: Then next answer is probably going to be a short one.
| | | 1: The duck has provided some options for the next answer.
| | | 0: The duck powers were not enought. You should try Google the problem or a different approach.
| options | Array[string] &#124; null | When possible, the duck will provide predefined options for the answers.
___
## GET /fulldialog
#### parameters
| parameter | type | description |
| --- | --- | --- |
| duck_id | string | Unique identifier for the duck session.
#### response
| field | type | description |
| --- | --- | --- |
| startTime | Date | This is when the conversation started.
| lastTime | Date | This is the time when the duck recieve the last answer.
| dialog | Array[string] | Full dialog.
___
## Installation
This API is build for [docker hub](https://hub.docker.com/r/lucardo/rubberduckapi/).
It does need a mongo database.
This are the docker parameters and defaults:
  - PORT: 80
  - MONGO_HOST: mongodb
  - MONGO_PORT: 27017

Or you could just use this [docker-compose.yml file](https://github.com/Guisardo/rubberduckapi/blob/master/docker-compose.yml)

For more info about docker check out http://www.docker.com
___
## TODOs
Hopefully this project is just starting. Many things are missing and any help would be welcome. For example:
 - Multiligual patterns and questions
 - Control panel
 - DB backup & restore
 - etc, etc

If you have any special request, please contact me through the [issues seccion](https://github.com/Guisardo/rubberduckapi/issues).

**Happy ducking!!**
