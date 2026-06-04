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

    // Assign validated data back to req
    req.body = result.data.body;
    req.params = result.data.params;
    req.query = result.data.query;

    next();
  };
};