const port = process.env.PORT ?? 5001;

fetch(`http://localhost:${port}/health`)
  .then((res) => {
    if (!res.ok) process.exit(1);
    process.exit(0);
  })
  .catch(() => process.exit(1));
