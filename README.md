Lightweight asynchronous data fetching hook for React. You can use this Hook for all request methods like GET, POST, PUT, DELETE, etc.

### New feature, access validation data properties like form input errors or old input values.

## Quick Features

- Data fetching (REST, promises).
- Method to handle data, access fetched data, isError, isLoading, isSuccess and validation properties.
- Is build for user experience in mind by being fast and high level of error handling.
- Never let your users miss any backend error(s). Catch all backend error(s) from frameworks like Laravel, Flask, Express, Django and many more into one single string.
- Can be used for all methods like GET, POST, PUT, DELETE, etc.
- Access validation data properties like form input errors or old input values.
- Fetched data is automatically served as JavaScript object.
- Add Custom fetch options like additionalCallTime or abortTimeoutTime.
- Takes advantage of React reactivity.
- Can work with TanStack Query.

## Features React

```js
  handleData,
  fetchedData,
  isError,
  error, // string for flash messages like error or warning
  errors, // for form input errors, old input values or nested error messages
  isLoading,
  isSuccess,
```

## Quick Start

1. Install package

```
npm i lightweight-react-fetch
```

2. Initialize use-lightweight-fetch

```js
import { reactFetch } from 'lightweight-react-fetch';
```

3. Use lightweight asynchronous data fetching hook

## Code example React for POST request

```js
import { reactFetch } from 'lightweight-react-fetch';

// use React fetch
const {
  handleData,
  fetchedData,
  isError,
  error,
  errors,
  isLoading,
  isSuccess,
} = reactFetch();

const submitPost = function () {
  handleData(
    '/posts', // url
    {
      method: 'POST', // GET, POST, PUT, DELETE, etc.
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    },
    // custom options
    {
      additionalCallTime: 300,
      abortTimeoutTime: 8000,
    }
  );
};
```

## Code example React for GET request

```js
import { reactFetch } from 'lightweight-react-fetch';

const pathPosts = 'https://jsonplaceholder.typicode.com/posts';

// use React fetch
const {
  handleData,
  fetchedData,
  isError,
  error,
  errors,
  isLoading,
  isSuccess,
} = reactFetch();

useEffect(() => {
  handleProducts(
    pathPosts,
    {},
    {
      additionalCallTime: 300,
      abortTimeoutTime: 8000,
    }
  );
}, []);
```
