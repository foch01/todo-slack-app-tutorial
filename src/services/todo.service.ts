import { Todo, TodoModelDb } from '../models/todo.model';

class TodoService {
    public static async createOneCustom(name: string): Promise<Todo> {
        const todo = new TodoModelDb();
        todo.name = name;
        await todo.save();
        return todo;
    }

    public static async findAll(): Promise<Todo[]> {
        return TodoModelDb.find();
    }

    public static async deleteOne(id: string): Promise<void> {
        await TodoModelDb.deleteOne({ id });
    }
}

export default TodoService;
