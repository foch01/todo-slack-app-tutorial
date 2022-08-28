import { App, ExpressReceiver, PlainTextOption, StaticSelectAction } from '@slack/bolt';
import { ButtonAction } from '@slack/bolt/dist/types/actions/block-action';
import * as mongoose from 'mongoose';
import { Todo } from './models/todo.model';
import TodoService from './services/todo.service';

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log('Connect successful to DB MONGO');
    })
    .catch((err) => {
        console.log(`MongoDb connection error. Please make sureDb is running. ${err}`);
    });

const receiver = new ExpressReceiver({
    signingSecret: process.env.SLACK_SIGNIN_SECRET,
    endpoints: {
        commands: '/slack/commands',
        events: '/slack/events',
        actions: '/slack/actions',
    },
});
const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    receiver,
});

app.command('/create', async ({ client, ack, command, body }) => {
    // Acknowledgment
    await ack();

    try {
        await client.views.open({
            trigger_id: command.trigger_id,
            view: {
                callback_id: 'create_todo_modal',
                title: {
                    type: 'plain_text',
                    text: "Création d'une tâche",
                },
                submit: {
                    type: 'plain_text',
                    text: 'Créer',
                },
                blocks: [
                    {
                        type: 'input',
                        block_id: 'todo_infos',
                        element: {
                            type: 'plain_text_input',
                            action_id: 'name_todo',
                            placeholder: {
                                type: 'plain_text',
                                text: 'Faire les courses',
                            },
                        },
                        label: {
                            type: 'plain_text',
                            text: 'Nom de la tâche',
                        },
                        hint: {
                            type: 'plain_text',
                            text: 'Décrivez le nom de la tâche',
                        },
                    },
                ],
                type: 'modal',
                private_metadata: body.channel_id,
            },
        });
    } catch (e) {
        console.error(`Modal impossible to open ${e}`);
    }
});

// Handle event a view_submission
app.view('create_todo_modal', async ({ ack, view, body }) => {
    try {
        await ack();
        const nameTodo = view.state.values.todo_infos.name_todo.value;
        await TodoService.createOneCustom(nameTodo);

        await app.client.chat.postEphemeral({
            channel: view.private_metadata,
            user: body.user.id,
            text: ':white_check_mark: Le todo a bien été ajouté à la liste.',
            as_user: true,
        });
    } catch (e) {
        console.error(`Une erreur est survenu lors de la soumission du formulaire : ${e}`);
    }
});

app.command('/todo', async ({ ack, command }) => {
    // Acknowledgment
    await ack();
    try {
        await app.client.chat.postEphemeral({
            channel: command.channel_id,
            user: command.user_id,
            text: "Bienvenue sur le tableau de bord de l'application",
            as_user: true,
            blocks: [
                {
                    type: 'actions',
                    elements: [
                        {
                            type: 'button',
                            text: {
                                type: 'plain_text',
                                text: ':page_facing_up: Voir les todos',
                                emoji: true,
                            },
                            value: 'view_todos',
                            action_id: 'VIEW_TODOS',
                        },
                    ],
                },
            ],
        });
    } catch (e) {
        console.error(`Une erreur est survenu : ${e}`);
    }
});

app.action('VIEW_TODOS', async ({ ack, respond }) => {
    await ack();

    try {
        const todos = await TodoService.findAll();
        const todoOptions: PlainTextOption[] = [];

        todos.forEach((todo: Todo) => {
            todoOptions.push({
                text: {
                    type: 'plain_text',
                    text: todo.name,
                    emoji: true,
                },
                value: todo.id,
            });
        });
        await respond({
            text: 'Liste des todos',
            blocks: [
                {
                    block_id: 'select_todo',
                    type: 'input',
                    element: {
                        type: 'static_select',
                        placeholder: {
                            type: 'plain_text',
                            text: 'Selectionner un todo',
                            emoji: true,
                        },
                        options: todoOptions,
                        action_id: 'SELECTED_TODO',
                    },
                    label: {
                        type: 'plain_text',
                        text: 'Liste des todos',
                        emoji: true,
                    },
                },
            ],
        });
    } catch (e) {
        console.error(e);
    }
});

app.action('SELECTED_TODO', async ({ ack, say, action, respond }) => {
    await ack();
    const todoId = (<StaticSelectAction>action).selected_option.value;
    await respond({
        as_user: true,
        replace_original: false,
        text: "Suppression d'un todo",
        blocks: [
            {
                type: 'actions',
                elements: [
                    {
                        type: 'button',
                        text: {
                            type: 'plain_text',
                            text: ':wastebasket: Supprimer le todo',
                            emoji: true,
                        },
                        style: 'danger',
                        value: todoId,
                        action_id: 'DELETE_TODO',
                    },
                ],
            },
        ],
    });
});

app.action('DELETE_TODO', async ({ ack, respond, action }) => {
    await ack();
    const todoId = (<ButtonAction>action).value;
    await TodoService.deleteOne(todoId);
    await respond({
        text: ':white_check_mark: Le todo a été supprimé.',
    });
});

export default app;
