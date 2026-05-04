export default function handler(req, res) {
  console.log("URL:", req.url);
  console.log("QUERY:", req.query);
  console.log("HEADERS:", req.headers);

  res.status(200).send("Logged");
}
