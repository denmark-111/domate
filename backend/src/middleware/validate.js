export const validate = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      const formattedErrors = result.error.issues.reduce((acc, issue) => {
        const [location, ...rest] = issue.path;

        // If it's a body error, strip 'body.' and just use the field path
        // If it's query/params, keep the location context
        const pathKey = location === "body" 
          ? rest.join(".") 
          : `${location}.${rest.join(".")}`;

        if (!acc[pathKey]) {
          acc[pathKey] = [];
        }

        acc[pathKey].push(issue.message);
        return acc;
      }, {});

      return res.status(400).json({
        message: "Validation failed",
        errors: formattedErrors,
      });
    }

    // Attach the validated data to the request object for use in controllers
    req.validated = result.data;

    next();
  };
};