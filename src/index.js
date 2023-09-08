const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const userName = request.headers['username']
  const foundUser = users.find(user => user.username === userName)
  if (!foundUser) {
    return response.status(404).json({
      error: 'User Not Found'
    })
  }
  request.user = foundUser
  return next()
}

const checkIfTodoExists = (request, response, next) => {
  const {
    todos
  } = request.user
  const {
    id: todoID
  } = request.params

  const foundTodo = todos.find(todo => todo.id === todoID)

  if (!foundTodo) {
    return response.status(404).json({error: 'todo not found'})
  }

  request.todoToBeUpdated = foundTodo

  return next()

}

app.post('/users', (request, response) => {
  const {
    name,
    username,
  } = request.body
  const userWithSameUserName =  users.find(user => user.username === username)
  if (userWithSameUserName) {
    return response
      .status(400)
      .json({
        error: 'Mensagem do erro'
      })
  }
  const userToBeInserted = {
    id:  uuidv4(),
    name,
    username,
    todos: [],
  }
  users.push(userToBeInserted)
  return response.status(201).json(userToBeInserted)
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const {
    todos
  } =  request.user
  return response.status(200).json([...todos])
  
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const {
    title,
    deadline
  } = request.body
  const createdTodo = {
    id: uuidv4(),
    done: false,
    title,
    deadline: new Date(deadline),
    created_at: new Date()
  }
  request.user.todos.push(createdTodo)
  return response.status(201).json({...createdTodo})
});

app.put('/todos/:id', checksExistsUserAccount, checkIfTodoExists, (request, response) => {
  const {
    title,
    deadline
  } = request.body
  request.todoToBeUpdated.title = title
  request.todoToBeUpdated.deadline = deadline
  return response.json({
    title: request.todoToBeUpdated.title,
    deadline: request.todoToBeUpdated.deadline,
    done: request.todoToBeUpdated.done
  })
});

app.patch('/todos/:id/done', checksExistsUserAccount, checkIfTodoExists, (request, response) => {
  request.todoToBeUpdated.done = true;
  return response.status(200).json({...request.todoToBeUpdated})
});

app.delete('/todos/:id', checksExistsUserAccount, checkIfTodoExists, (request, response) => {
  const { user, todoToBeUpdated } = request;
  user.todos = user.todos.filter(todo => todo.id !== todoToBeUpdated.id)
  return response.status(204).send()
});

module.exports = app;