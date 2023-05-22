// import { ActionArgs, LoaderArgs, json, redirect } from "@remix-run/node";
// import { Form, Link, useActionData } from "@remix-run/react";
// import { db } from "../db.server";
// import { getSession, commitSession, destroySession } from "../utils/alphaAccessKeySession.server";
// import {
//   getSession as userGetSession,
//   commitSession as userCommitSession,
// } from "../utils/alphaSession.server";
// import { createUser } from "~/utils/validateUser.server";

// export const loader = async ({ request }: LoaderArgs) => {
//   const session = await getSession(request.headers.get("Cookie"));
//   const user = await userGetSession(request.headers.get("Cookie"));
//   if (user.has("userId")) throw redirect("/alpha/dashboard");
//   else if (session.has("alphaKey")) return null;
//   else throw redirect("/");
// };

// export async function action({ request }: ActionArgs) {
//   const formData = await request.formData();
//   const username = formData.get("username") as string;
//   const password = formData.get("password") as string;

//   let user = await db.user.findUnique({
//     where: { username: username as string },
//   });

//   if (user) return json({ message: `Username Taken` });
//   else {
//     const userSession = await userGetSession(request.headers.get("Cookie"));
//     //create user in db
//     let newUser = await createUser({ username, password });

//     userSession.set("userId", newUser.id.toString());

//     return redirect("/alpha/dashboard", {
//       headers: {
//         "Set-Cookie": await userCommitSession(userSession),
//       },
//     });
//   }
// }

// export default function Index() {
//   const data = useActionData<typeof action>();

//   return (
//     <div className="w-screen h-screen overflow-hidden">
//       {" "}
//       <div className="relative left-0 w-full flex flex-col h-full items-center align-middle justify-center">
//         <div className="h-auto w-auto relative border-2 border-black rounded p-10">
//           <p className="font-sans text-2xl inline-block">Sign up</p>
//           <Form method="post" className="mt-5 flex flex-col">
//             <input
//               type="text"
//               placeholder="username"
//               name="username"
//               className="border-black rounded"
//             />
//             <input
//               type="password"
//               placeholder="password"
//               name="password"
//               className="border-black rounded mt-5"
//             />
//             <button type="submit" className="font-sans text-base mt-5 inline-block">
//               Submit
//             </button>
//           </Form>
//           <p className="mt-5">
//             Already have fether account?{" "}
//             <Link to="/alpha/login" className="border-b border-black">
//               Login
//             </Link>
//           </p>

//           {data && (
//             <p className="font-sans text-red-500 text-base mt-4 inline-block">{data.message}</p>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }
