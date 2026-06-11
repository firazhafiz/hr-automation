import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      employeeId?: string;
    };
  }
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "admin@toshinprima.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          throw new Error("Email dan password harus diisi.");
        }

        // Check Admin
        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (user) {
          if (!user.password) throw new Error("Email atau password tidak sesuai.");
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
          if (!isPasswordValid) throw new Error("Email atau password tidak sesuai.");
          
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: "admin",
          };
        }

        // Check Employee
        const employee = await prisma.employee.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (employee) {
          if (!employee.password) throw new Error("Akun Anda belum memiliki password. Silakan hubungi Admin.");
          const isPasswordValid = await bcrypt.compare(credentials.password, employee.password);
          if (!isPasswordValid) throw new Error("Email atau password tidak sesuai.");

          return {
            id: employee.id,
            email: employee.email,
            name: employee.nama,
            role: "employee",
            employeeId: employee.id,
          };
        }

        throw new Error("Email atau password tidak sesuai.");
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string | undefined;
        session.user.employeeId = token.employeeId as string | undefined;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.employeeId = (user as any).employeeId;
      }
      return token;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
