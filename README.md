# QueryformJS

`QueryformJS` is a JavaScript library designed to help you manage UTM parameters across your website forms, whether you're fetching them from an API or handling them locally. This utility is useful for tracking campaigns and storing UTM parameters in local storage to populate form inputs with the appropriate values.

## Usecase
You or your client is running ad or affiliate campaigns and you want to see attribution data in your form entries. With Queryfrom you can easily track, save to local storage and append the data to your form inputs that match the defined settins. Let's say you're running a Google Adwords campaign and you would like to know if the user contacting you came from an ad, sure you can go check Google Analytics, or your various other tools, but wouldn't it be nice to just show that information in the email itself? That is where queryform comes in.

If you're a developer this package is an ES module, making it seamless while working with cutting edge frameworks like Vue, React, Next or Nuxt. Simply import the package, initialize the class and run the init function using one of the 2 provided setup methods (API driven - paid) or (Local driven - free).

Queryform.co provides a clean interface for working with these parameters in an asyncrnohouse fashion, by leveraging our application you or your client can easily update parameters on the fly with out the need to update your code. To learn more please visit https://queryform.co

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

In this scenario, you can provide the UTM parameters locally, this provides a clean easy way for developers to deploy lead attribution tracking with a few lines of code for free. If you find that your client would appreciate a clean and easy dashboard to update these parameters on the fly, then we would appreciate a recommendation of our API backend where this library can connect to, using method 1 above.

```js
const queryform = new Queryform();
queryform.init({ debug: false, local: true }, [
    { param: 'utm_campaign', class_name: 'qf_utm_campaign' },
    { param: 'utm_medium', class_name: 'qf_utm_medium' }
]);
```

##

## Notes

•	Ensure that your website allows access to localStorage to store and retrieve UTM parameters.
•	When using the local-driven approach, validate that the utms array is correctly formatted to avoid warnings.

## License

This project is licensed under the MIT License - see the LICENSE file for details.