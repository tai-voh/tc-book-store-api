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


### Users
-   GET /api/users: Retrieves a list of users.
-   GET /api/users/:userId: Retrieves a specific user by ID.
-   POST /api/users: Creates a new user.
-   POST /api/users/login: Login user.
-   PUT /api/users/:userId: Updates a user by ID.
-   DELETE /api/users/:userId: Deletes a user by ID.

### Books
-   GET /api/books: Retrieves a list of books.
-   GET /api/books/:bookId: Retrieves a specific book by ID.
-   POST /api/books: Creates a new book.
-   PUT /api/books/:bookId: Updates a book by ID.
-   DELETE /api/books/:bookId: Deletes a book by ID.

### Cart
-   GET /api/carts: Retrieves carts of all users.
-   GET /api/carts/user/:userId: Retrieves unpaid books in cart of an user.
-   GET /api/carts/:cartId: Retrieves a specific cart by ID.
-   POST /api/carts: Creates a new cart.
-   PUT /api/carts/:cartId: Updates a cart by ID.
-   DELETE /api/carts/:cartId: Deletes a cart by ID.

### Order
-   GET /api/orders: Retrieves orders of all users.
-   GET /api/orders/user/:userId: Retrieves orders of an user.
-   GET /api/orders/:orderId: Retrieves a specific order by ID.
-   POST /api/orders: Creates a new order.
-   PUT /api/orders/:orderId: Updates a order by ID.
-   DELETE /api/orders/:orderid: Deletes a order by ID.
