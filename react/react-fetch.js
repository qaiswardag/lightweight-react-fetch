import { useState } from 'react';
import { usePromise } from '../helpers/use-promise';
import { isObject } from '../helpers/is-object';

export const reactFetch = function () {
  // is loading, is error, fetched data
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState(null);
  const [fetchedData, setFetchedData] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // controller, signal, abort timeout, additional time out
  const controller = new AbortController();
  let goDirectToError = false;

  // method
  const handleData = async function (
    url,
    fetchOptions = {},
    customFetchOptions = {}
  ) {
    // set "additional call time" timeout to 0 if not set
    if (customFetchOptions.additionalCallTime === undefined) {
      customFetchOptions.additionalCallTime = 0;
    }
    // set "abort timeout" time to 8000 ms if not set
    if (customFetchOptions.abortTimeoutTime === undefined) {
      customFetchOptions.abortTimeoutTime = 20000;
    }

    // abort
    const timer = setTimeout(() => {
      controller.abort();
    }, customFetchOptions.abortTimeoutTime);

    // try
    try {
      setIsLoading(true);
      // set promise
      const promise = usePromise(customFetchOptions.additionalCallTime);

      // wait for additional response time. additional time is set when calling the method
      await promise;

      // if loading time gets exceeded
      if (controller.signal.aborted) {
        setIsError(false);
        setIsLoading(false);
        clearTimeout(timer);

        // jump directly to the end of catch
        goDirectToError = true;

        // throw new error
        throw new Error(
          `Error 500. The loading time has been exceeded. Please refresh this page`
        );
      }

      // response
      const response = await fetch(url, fetchOptions);

      // check if response is ok. if not throw error
      if (response.status !== 200 && response.status !== 201) {
        // throw new error
        throw new Error(`${response.status}. ${response.statusText}`);
      }

      // set variable for content type application/json
      const contentType = response.headers.get('content-type');

      // check if request is application/json in the request header
      if (contentType.includes('application/json')) {
        // convert to json
        const json = await response.json();
        // set fetched data
        setFetchedData(json);

        setIsError(false);
        setIsLoading(false);
        setIsSuccess(true);
        clearTimeout(timer);

        // return json
        return json;
      }

      setIsError(false);
      setIsLoading(false);
      setIsSuccess(true);
      clearTimeout(timer);
      // "fetched data" is null at this moment

      // jump directly to the end of catch
      goDirectToError = true;

      // throw new  error
      throw new Error(`500. No application/json in the request header`);

      // catch
    } catch (err) {
      clearTimeout(timer);
      setIsLoading(false);
      setIsSuccess(false);

      // default error
      setIsError(true);
      setError(`Not able to fetch data. Error status: ${err}.`);

      const response = await fetch(url, fetchOptions);

      // abort fetch
      if (err.name === 'AbortError') {
        setIsError(true);
        setError('Error fetching data: The fetch was aborted');
        setErrors('Error fetching data: The fetch was aborted');
      }
      // handle errors
      if (err.name !== 'AbortError') {
        // set variable for content type application/json
        const contentType = response.headers.get('content-type');

        // check if request is application/json in the request header
        if (
          contentType.includes('application/json') &&
          goDirectToError === false
        ) {
          // collect errors and convert errors to json
          let collectingErrorsJson = await response.json();

          // set validation data properties like form input errors or old input values
          setErrors(collectingErrorsJson);

          // check if fetched data is a string
          if (typeof collectingErrorsJson === 'string') {
            setIsError(true);
            setError(
              `Not able to fetch data. Error status: ${err.message}. ${collectingErrorsJson}`
            ); // cllect
          }

          // check if fetched data is an array
          if (Array.isArray(collectingErrorsJson)) {
            setIsError(true);
            setError(
              `Not able to fetch data. Error status: ${
                err.message
              }. ${collectingErrorsJson.join(' ')}`
            ); // collect
          }

          // check if fetched data is an object
          if (isObject(collectingErrorsJson)) {
            const errorsKeys = Object.keys(collectingErrorsJson);
            // access values of collectingErrorsJson for checking is it contains nested objects or array
            const errorsValues = Object.values(collectingErrorsJson);

            // check if "collecting errors json" is an empty object
            // if true return response status code
            if (errorsKeys.length === 0) {
              // set "is error"
              setIsError(true);
              setError(
                `Not able to fetch data. Error status: ${response.status}.`
              ); // collect
            }

            // check if "collecting errors json" contains nested objects
            // or arrays, "collecting errors json" is not gonna be included in isError
            // "form validation errors" can be used to instead to access nested objects or array properties
            if (errorsKeys.length > 0) {
              //
              for (let i = 0; i < errorsKeys.length; i++) {
                if (Array.isArray(errorsValues[i])) {
                  // set "is error"
                  setIsError(true);
                  setError(
                    `Not able to fetch data. Error status: ${err.message}`
                  ); // collect
                  break;
                }
                if (isObject(errorsValues[i])) {
                  // set "is error"
                  setIsError(true);
                  setError(
                    `Not able to fetch data. Error status: ${err.message}`
                  ); // collect
                  break;
                }

                //
                // if "collecting errors json" do not contains nested objects or arrays
                if (
                  !Array.isArray(errorsValues[i]) &&
                  !isObject(errorsValues[i])
                ) {
                  const errorObjToString =
                    Object.values(collectingErrorsJson).join(' ');
                  // set "is error"
                  setIsError(true);
                  setError(
                    `Not able to fetch data. Error status: ${err.message}. ${errorObjToString}` // collect
                  );
                }
              }
            }
          }

          // end if content type is application/json
        }

        // check if request is application/json in the request header
        if (
          !contentType.includes('application/json') ||
          goDirectToError === true
        ) {
          setIsError(true);
          setError(`Not able to fetch data. Error status: ${err.message}`); // collect
        }
      }

      // throw error
      throw err;

      // end catch
    }

    // end fetch data method
  };

  // return
  return {
    handleData,
    fetchedData,
    isSuccess,
    isLoading,
    isError,
    error,
    errors,
  };

  // end of use fetch method
};
