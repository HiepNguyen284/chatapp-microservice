const port = process.env.PORT ?? 5003;

fetch(`http://localhost:${port}/health`)
  .then((res) => {
    if (!res.ok) process.exit(1);
    process.exit(0);
  })
  .catch(() => process.exit(1));
