export const validate = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      const errors = {};

      for (const issue of result.error.issues) {
        const [location, ...pathParts] = issue.path;

        let message = issue.message;

        // Handle the case where the entire body is missing
        if (
          location === "body" &&
          pathParts.length === 0 &&
          issue.code === "invalid_type" &&
          issue.input === undefined
        ) {
          message = "Request body is required";
        }

        let field;

        if (location === "body") {
          // body.name -> name
          field = pathParts.join(".");
        } else {
          // params.id -> params.id
          // query.page -> query.page
          field = `${location}.${pathParts.join(".")}`;
        }

        // Handle object-level errors
        if (!field) {
          field = location || "general";
        }

        if (!errors[field]) {
          errors[field] = [];
        }

        errors[field].push(message);
      }

      return res.status(422).json({
        message: "Validation failed",
        errors,
      });
    }

    // Attach the validated data to the request object
    req.validated = result.data;

    next();
  };
};