# BOOK STORE API

This is a practice project for NodeJS with MongoDB.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Routes](#routes)

## Installation

1. Clone the repository:
   ```shell
   git clone https://github.com/TuanMc/tc-book-store-api.git
   ```
2.  Change into the project directory:
    ```shell
    cd tc-book-store-api
    ```
3.  Install the dependencies:
    ```shell
    npm i
    ```
4.  Set up the configuration (if applicable):

- Copy the `.env.example` file and rename it to `.env`.

- Update the configuration values in `.env` according to your environment.

## Usage

1. Start the development server:
   ```shell
   npm start
   ```

2.  Open your browser and navigate to http://localhost:3000 to access the application.

## Routes

### Authentication
-   POST /api/auth/login
-   POST /api/auth/logout
-   POST /api/auth/register

### Users
-   GET /api/users: Retrieves a list of users.
-   GET /api/users/:id: Retrieves a specific user by ID.
-   POST /api/users: Creates a new user.
-   PUT /api/users/:id: Updates a user by ID.
-   DELETE /api/users/:id: Deletes a user by ID.

### Books
-   GET /api/books: Retrieves a list of books.
-   GET /api/books/:id: Retrieves a specific book by ID.
-   POST /api/books: Creates a new book.
-   PUT /api/books/:id: Updates a book by ID.
-   DELETE /api/books/:id: Deletes a book by ID.

### Book Category
-   GET /api/books/categories: Retrieves a list of books' categories.

### Cart
-   GET /api/carts/:userId: Retrieves unpaid books in cart.
-   TBD