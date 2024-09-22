# transactions-categorizer

This service allows customers to manage their transactions through the following functionalities:

- **Upload a Single Transaction:** Customers can upload a transaction using a classic UI form.
- **Upload Multiple Transactions:** Customers can upload transactions via a CSV file.

## Retrieval Options

- **Retrieve by ID:** Customers can retrieve a single transaction by its unique ID.
- **Retrieve All Transactions:** Customers can retrieve all transactions.

## Setup and Running Instructions

1. **Clone the repository**
   ```bash
   git clone git@github.com:MohamedDounnani94/transactions-categorizer.git
   cd transactions-categorizer
   ```

3. **Set up environment variables**
   - Create a `.env` file in the root directory
   - Add your OpenAI API key:
     ```env
     PORT=3000
     OPENAI_API_KEY=your_api_key_here
     MONGO_DB_URI=mongodb://mongo:27017/categorizer
     ```

## Running with Docker

1. **Make sure Docker and Docker Compose are installed.**

2. **Use Makefile commands to manage your Docker setup:**

   - **Start the application:**
     ```bash
     make build up logs
     ```

   - **Start the application in dev mode**
     ```bash
     make build up-dev logs-dev
     ```

   - **Shut down all running services:**
     ```bash
     make down
     ```

## Running Tests

To run tests, you need to enter the development container using the following command:

```bash
docker-compose exec app_dev /bin/sh
```

Once inside the container, run:

```bash
npm run test
```

## API Documentation

### Transaction Endpoints

#### POST /transactions/upload
- **Description**: Upload a file containing multiple transactions.
- **Request**: Multipart/form-data with a file field named `file`.
- **Response**: 
  - **200 OK**: Successfully processed the file.
  - **400 Bad Request**: If the file format is invalid or an error occurs during processing.

#### POST /transactions
- **Description**: Submit a new transaction.
- **Request Body**:
  ```json
  {
    "transactionId": "string",
    "amount": "number",
    "timestamp": "date",
    "description": "string",
    "transactionType": "debit" | "credit",
    "accountNumber": "string"
  }
  ```
- **Validation**: Requires the following fields:
  - `transactionId`.
  - `amount`.
  - `timestamp`
  - `description`
  - `transactionType`
  - `accountNumber`
  
- **Response**: 
  - **201 Created**: Successfully created the transaction.
  - **400 Bad Request**: If validation fails.

#### GET /transactions
- **Description**: Retrieve all categorized transactions.
- **Response**:
  - **200 OK**: Returns a list of transactions.

#### GET /transactions/:id
- **Description**: Retrieve a specific transaction by ID.
- **Response**:
  - **200 OK**: Returns the requested transaction.
  - **404 Not Found**: If the transaction with the specified ID does not exist.

## Trade-offs and Design Decisions -- Decisions taken given the time constraint
1. Skipped user authentication and authorization. Decide to focus on categorization algorithm improving efficency.
2. Skipped user creation and assign each transaction to an user.
3. Skipped file validation.
4. Used MongoDB instead of Redis for caching.
5. Transactions with the same transactionId will be overwritten.

## Time constraint future Improvements
1. Implement user authentication and authorization.
2. Add user entity and assign each transaction the user ID.
3. Implement batch processing for large CSV files. I would save in batches the file in a datawarehouse and process it asyncronously.
4. Add more error handling and logging.
5. Implement redis caching to reduce API calls and improve performance. The mongo cache was done for simplicity
6. Retrieve the API Key from a secret manager
7. Persistent Database: The database currently resets with each build.
8. For a more general approach, I would use a vector database as a caching strategy to identify similar descriptions.