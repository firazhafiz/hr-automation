import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/scan/:path*",
    "/submissions/:path*",
    "/employees/:path*",
    "/portal/:path*",
  ],
};
