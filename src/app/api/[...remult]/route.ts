import { NextRequest } from "next/server";
import { remultNextApp } from "remult/remult-next";
import { Task } from "../../../shared/Task";
import { UserInfo } from "remult";
import { TasksController } from "../../../shared/TasksController";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { createPostgresConnection } from "remult/postgres";
import ably from "ably/promises";
import { AblySubscriptionServer } from "remult/ably";

const api = remultNextApp({
  entities: [Task],
  controllers: [TasksController],
  getUser: async () => {
    return (await getServerSession(authOptions))?.user as UserInfo;
  },
  dataProvider: createPostgresConnection(),
  subscriptionServer: new AblySubscriptionServer(
    new ably.Rest(process.env["ABLY_API_KEY"]!)
  ),
});

export const { POST, PUT, DELETE, GET, withRemult } = api;
