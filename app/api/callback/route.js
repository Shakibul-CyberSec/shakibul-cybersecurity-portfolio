export async function GET(request) {
  const url = request.url;

  const { searchParams } = new URL(url);
  const query = Object.fromEntries(searchParams.entries());

  const headers = Object.fromEntries(request.headers.entries());

  console.log("FULL URL:", url);
  console.log("QUERY:", query);
  console.log("HEADERS:", headers);

  return new Response("Logged", { status: 200 });
}
