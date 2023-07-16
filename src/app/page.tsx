"use client";
import { FormEvent, useEffect, useState } from "react";
import { UserInfo, remult } from "remult";
import { Task } from "../shared/Task";
import { TasksController } from "../shared/TasksController";
import { signIn, signOut, useSession } from "next-auth/react";
import ably from "ably/promises";
import { AblySubscriptionClient } from "remult/ably";

const taskRepo = remult.repo(Task);

export default function Page() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const session = useSession();

  useEffect(() => {
    remult.apiClient.subscriptionClient = new AblySubscriptionClient(
      new ably.Realtime({ authUrl: "/api/getAblyToken" })
    );
    remult.user = session.data?.user as UserInfo;
    if (session.status === "unauthenticated") signIn();
    else if (session.status === "authenticated")
      return taskRepo
        .liveQuery({
          limit: 20,
          orderBy: { completed: "asc" },
          //where: { completed: true },
        })
        .subscribe((info) => setTasks(info.applyChanges));
  }, [session]);

  async function addTask(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      const newTask = await taskRepo.insert({ title: newTaskTitle });
      setNewTaskTitle("");
    } catch (error: any) {
      alert(error.message);
    }
  }

  async function setAllCompleted(completed: boolean) {
    await TasksController.setAllCompleted(completed);
  }

  if (session.status !== "authenticated") return <></>;
  return (
    <div>
      <h1>Todos</h1>
      <main>
        <div>
          Hello {remult.user?.name}
          <button onClick={() => signOut()}>Sign Out</button>
        </div>
        {taskRepo.metadata.apiInsertAllowed() && (
          <form onSubmit={(e) => addTask(e)}>
            <input
              value={newTaskTitle}
              placeholder="What needs to be done?"
              onChange={(e) => setNewTaskTitle(e.target.value)}
            />
            <button>Add</button>
          </form>
        )}
        {tasks.map((task) => {
          async function deleteTask() {
            try {
              await taskRepo.delete(task);
              setTasks((tasks) => tasks.filter((t) => t !== task));
            } catch (error: any) {
              alert(error.message);
            }
          }
          function setTask(value: Task) {
            setTasks((tasks) => tasks.map((t) => (t === task ? value : t)));
          }
          async function setCompleted(completed: boolean) {
            setTask(await taskRepo.save({ ...task, completed }));
          }
          function setTitle(title: string) {
            setTask({ ...task, title });
          }

          async function doSaveTask() {
            try {
              setTask(await taskRepo.save(task));
            } catch (error: any) {
              alert(error.message);
            }
          }

          return (
            <div key={task.id}>
              <input
                type="checkbox"
                checked={task.completed}
                onChange={(e) => setCompleted(e.target.checked)}
              />
              <input
                value={task.title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <button onClick={() => doSaveTask()}>Save</button>
              {taskRepo.metadata.apiDeleteAllowed() && (
                <button onClick={() => deleteTask()}>Delete</button>
              )}
            </div>
          );
        })}
        <div>
          <button onClick={(e) => setAllCompleted(true)}>
            Set all completed
          </button>
          <button onClick={(e) => setAllCompleted(false)}>
            Set all uncompleted
          </button>
        </div>
      </main>
    </div>
  );
}
