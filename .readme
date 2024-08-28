# QueryformJS

`QueryformJS` is a JavaScript library designed to help you manage UTM parameters across your website forms, whether you're fetching them from an API or handling them locally. This utility is useful for tracking campaigns and storing UTM parameters in local storage to populate form inputs with the appropriate values.

## Installation

You can install `QueryformJS` via npm:

```bash
npm install @queryform/queryformjs
```

## Usage

### Importing the Library

To use the QueryformJS library, import it into your JavaScript file:

```js
import Queryform from '@queryform/queryformjs';
```

### Scenarios

1. API Driven

In this scenario, the domain parameters (UTMs) are retrieved from the Queryform API backend, where you can easily control your parameters from an easy to use interface that does not require code updates to adjust tracked query parameters.

```js
const queryform = new Queryform('9cde42e9-8a9a-40c7-adee-6364fdb6f709');
queryform.init();
```

2. Local Driven

In this scenario, you can provide the UTM parameters locally, bypassing the need for an API:

```js
const queryform = new Queryform();
queryform.init({ debug: false, local: true }, [
    { param: 'utm_campaign', class_name: 'qf_utm_campaign' },
    { param: 'utm_medium', class_name: 'qf_utm_medium' }
]);
```

## Notes

	•	Ensure that your website allows access to localStorage to store and retrieve UTM parameters.
	•	When using the local-driven approach, validate that the utms array is correctly formatted to avoid warnings.

## License

This project is licensed under the MIT License - see the LICENSE file for details.