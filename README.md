# QueryformJS

`QueryformJS` is a powerful JavaScript library designed to streamline the management of UTM parameters across your website forms. Whether you're fetching them from an API or handling them locally, this utility is invaluable for tracking campaign data and storing UTM parameters in local storage. It automatically populates form inputs with the corresponding values, providing a seamless way to capture attribution data directly within your forms.

## Use Case

Are you or your client running ad or affiliate campaigns? Do you want to see attribution data directly in your form entries? With `QueryformJS`, you can effortlessly track UTM parameters, save them to local storage, and append them to your form inputs based on predefined settings. For example, if you're running a Google AdWords campaign and want to know if a user contacting you came from an ad, `QueryformJS` can display that information directly in the email you receive from the form submission. This saves you from having to check multiple analytics tools, making the data instantly accessible.

### Key Benefits:
- **Direct Attribution Data**: See where your users are coming from directly in the form submissions, perfect for instant insight without needing to dive into analytics platforms.
- **Flexible Integration**: As an ES module, `QueryformJS` integrates seamlessly with modern JavaScript frameworks like Vue, React, Next.js, or Nuxt.js.
- **Simple Setup**: Import the package, initialize the class, and run the `init` function using one of the two provided setup methods:
  - **API Driven** (paid): Fetch and manage UTM parameters via a centralized API.
  - **Local Driven** (free): Handle UTM parameters locally with no external dependencies.

### Using Queryform.co
For an enhanced experience, consider using [Queryform.co](https://queryform.co), a platform that offers a clean and asynchronous interface for managing UTM parameters. With Queryform.co, you or your client can easily update parameters on the fly without needing to alter your code. This allows for dynamic and efficient management of your campaign tracking efforts.

To learn more, visit [Queryform.co](https://queryform.co).

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