import { Model, model, Schema } from 'mongoose';

export interface Todo {
    id: string;
    name: string;
}

export const TodoModelSchema = new Schema<Todo>(
    {
        name: String,
    },
    {
        timestamps: true,
    },
);

export const TodoModelDb: Model<Todo> = model('Todo', TodoModelSchema);
