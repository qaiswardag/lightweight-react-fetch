import { useState } from 'react';
import { usePromise } from '../helpers/use-promise';
import { isObject } from '../helpers/is-object';

export const reactFetch = function () {
  // Initial state variables
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState(null);
  const [fetchedData, setFetchedData] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Abort controller for aborting fetch requests
  const controller = new AbortController();
  let goDirectToError = false;

  // Fetch data from the specified URL with the given options
  const handleData = async function (
    url,
    fetchOptions = {},
    customFetchOptions = {}
  ) {
    // Set default values for additionalCallTime and abortTimeoutTime if not provided
    if (customFetchOptions.additionalCallTime === undefined) {
      customFetchOptions.additionalCallTime = 0;
    }
    if (customFetchOptions.abortTimeoutTime === undefined) {
      customFetchOptions.abortTimeoutTime = 20000;
    }

    // Set a timer to abort the fetch request after abortTimeoutTime
    const timer = setTimeout(() => {
      controller.abort();
    }, customFetchOptions.abortTimeoutTime);

    try {
      setIsLoading(true);
      const promise = usePromise(customFetchOptions.additionalCallTime); // Create a promise that resolves after additionalCallTime
      // Wait for the promise to resolve
      await promise;

      // If the loading time gets exceeded, abort the fetch request
      if (controller.signal.aborted) {
        setIsError(false);
        setIsLoading(false);
        clearTimeout(timer);

        // Skip to the end of the catch block
        goDirectToError = true;
        throw new Error(
          'Error 500. The loading time has been exceeded. Please refresh this page'
        );
      }

      const response = await fetch(url, fetchOptions); // Make the fetch request

      // Check if the fetch request was successful. If not, throw an error
      if (response.status !== 200 && response.status !== 201) {
        throw new Error(`${response.status}. ${response.statusText}`);
      }

      // Get the Content-Type of the response
      const contentType = response.headers.get('content-type');

      // Content-Type 'application/json'
      if (contentType.includes('application/json')) {
        clearTimeout(timer);
        setIsError(false);
        setIsLoading(false);
        setIsSuccess(true);

        // Set the fetched data
        const json = await response.json();
        setFetchedData(json);
        return json;
      }
      // Content-Type 'text/plain' or 'text/html'
      if (
        contentType.includes('text/plain') ||
        contentType.includes('text/html')
      ) {
        clearTimeout(timer);
        setIsError(false);
        setIsLoading(false);
        setIsSuccess(true);

        // Set the fetched data
        const json = await response.text();
        setFetchedData(json);
        return json;
      }

      // Handle non-GET requests without 'application/json', 'text/plain' or 'text/html'
      if (
        fetchOptions?.method !== 'GET' &&
        fetchOptions?.method !== 'get' &&
        fetchOptions?.method !== undefined
      ) {
        clearTimeout(timer);
        setIsError(false);
        setIsLoading(false);
        setIsSuccess(true);

        setFetchedData('Your request was processed successfully.');
        return 'Your request was processed successfully.';
      }

      // If the request method is GET and the Content-Type is not application/json, throw an error
      setIsError(false);
      setIsLoading(false);
      setIsSuccess(true);
      clearTimeout(timer);

      goDirectToError = true; // Skip to the end of the catch block
      throw new Error(
        "'Error 500. The request header must contain 'application/json', 'text/plain' or 'text/html'"
      );
    } catch (err) {
      clearTimeout(timer); // Stop the timer
      setIsLoading(false); // Stop loading
      setIsSuccess(false); // Mark request as unsuccessful

      // Default error handling
      setIsError(true);
      setError(`Not able to fetch data. Error status: ${err}.`);

      // Try to fetch the data again
      const response = await fetch(url, fetchOptions);

      // If fetch request was aborted, handle the AbortError
      if (err.name === 'AbortError') {
        setIsError(true);
        setError('Error fetching data: The fetch was aborted');
        setErrors('Error fetching data: The fetch was aborted');
      }

      // Handle other types of errors
      if (err.name !== 'AbortError') {
        // Get the Content-Type of the response
        const contentType = response.headers.get('content-type');

        // If the response's Content-Type is application/json, parse the response body as JSON
        if (
          contentType.includes('application/json') &&
          goDirectToError === false
        ) {
          let collectingErrorsJson = await response.json();

          // Save the error messages
          setErrors(collectingErrorsJson);

          // If the error message is a string, handle it accordingly
          if (typeof collectingErrorsJson === 'string') {
            setIsError(true);
            setError(
              `Not able to fetch data. Error status: ${err.message}. ${collectingErrorsJson}`
            );
          }

          // If the error message is an array, handle it accordingly
          if (Array.isArray(collectingErrorsJson)) {
            setIsError(true);
            setError(
              `Not able to fetch data. Error status: ${
                err.message
              }. ${collectingErrorsJson.join(' ')}`
            );
          }

          // If the error message is an object, handle it accordingly
          if (isObject(collectingErrorsJson)) {
            const errorsKeys = Object.keys(collectingErrorsJson);
            const errorsValues = Object.values(collectingErrorsJson);

            // If there are no errors, handle it accordingly
            if (errorsKeys.length === 0) {
              setIsError(true);
              setError(
                `Not able to fetch data. Error status: ${response.status}.`
              );
            }

            // If there are errors, handle them accordingly
            if (errorsKeys.length > 0) {
              for (let i = 0; i < errorsKeys.length; i++) {
                if (Array.isArray(errorsValues[i])) {
                  setIsError(true);
                  setError(
                    `Not able to fetch data. Error status: ${err.message}`
                  );
                  break;
                }
                if (isObject(errorsValues[i])) {
                  setIsError(true);
                  setError(
                    `Not able to fetch data. Error status: ${err.message}`
                  );
                  break;
                }

                // If the error is neither an array nor an object, handle it accordingly
                if (
                  !Array.isArray(errorsValues[i]) &&
                  !isObject(errorsValues[i])
                ) {
                  const errorObjToString =
                    Object.values(collectingErrorsJson).join(' ');
                  // Set error message when error body is a flat object
                  setIsError(true);
                  setError(
                    `Not able to fetch data. Error status: ${err.message}. ${errorObjToString}`
                  );
                }
              }
            }
          }
        }

        // If the response's Content-Type is not application/json, handle it accordingly
        if (
          contentType.includes('application/json') === false ||
          goDirectToError === true
        ) {
          setIsError(true);
          setError(`Not able to fetch data. Error status: ${err.message}`);
        }
      }

      // Rethrow the error for further handling
      throw err;
    }
  };

  // Return the state variables and the fetch function
  return {
    handleData,
    fetchedData,
    isSuccess,
    isLoading,
    isError,
    error,
    errors,
  };
};
