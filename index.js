'use strict';

const express = require('express')
const app     = express();
const http    = require('http').Server(app);
const io      = require('socket.io')(http);
const r       = require('rethinkdbdash')({ db: 'demoday' });

app.use(express.static('public'));
app.use('/node_modules', express.static('node_modules'));

io.on('connection', socket => {
    let initialData;

    r.table('usersFriends').without('id').run()
        .then(usersFriends => {
            initialData = usersFriends;

            let allNames = initialData.map(relation => relation.source).concat(
                                initialData.map(relation => relation.target)
                             );

            // Uniq
            allNames = allNames.filter((value, index, self) => self.indexOf(value) === index);

            // All single users still not related
            return r.table('users').filter(user =>
                r.expr(allNames).contains(user('name')).not()
            ).without('id');
        })
        .then(additionalData => {
            for (let singleUser of additionalData) {
                initialData.push({
                    source: singleUser.name
                });
            }

            socket.emit('initialData', initialData);
        });

    socket.on('user', name => {
        console.log(`Insert { name: ${name} } on users`);
        r
            .table('users')
            .insert({
                name: name
            })
            .run();
    });

    socket.on('friend', node => {
    	const source = node.source;
    	const target = node.target;

        console.log(`Insert { source: ${source}, target: ${target} } on usersFriends`);

        r
            .table('usersFriends')
            .insert({
                source: source,
                target: target
            })
            .run()
            .then(() => {
                return r
                    .table('users')
                    .insert({
                        name: target
                    }, { conflict: 'update' })
                    .run();
            });
    });

    socket.on('removeUser', name => {
        console.log(`Remove { name: ${name} } from users and all its links`);
        r
            .table('users')
            .filter({
                name: name
            })
            .delete()
            .run()
            .then(() => {
                return r
                    .table('usersFriends')
                    .filter(
                        r.row('source').eq(name).or(
                            r.row('target').eq(name)
                        )
                    )
                    .delete()
                    .run();
            });
    });

    socket.on('removeFriend', node => {
        const source = node.source;
        const target = node.target;

        console.log(`Remove { source: ${source}, target: ${target} } from usersFriends`);
        r
            .table('usersFriends')
            .filter({
                source: source,
                target: target
            })
            .delete()
            .run();
    });
});

r
    .table('users')
    .changes()
    .run()
    .then(c => {
        c.on('data', user => {
            console.log('changes', user);
            if (user.new_val) {
                const userName = user.new_val.name;
                io.emit('addnode', {
                    source: userName
                });
            } else {
                console.log('just delete it');
                const userName = user.old_val.name;
                io.emit('removenode', userName);
            }
        });
    });

r
    .table('usersFriends')
    .changes()
    .run()
    .then(c => {
        c.on('data', user => {
            if (user.new_val) {
                const source = user.new_val.source;
                const target = user.new_val.target;
                io.emit('addnode', {
                    source: source,
                    target: target
                });
            } else {
                const source = user.old_val.source;
                const target = user.old_val.target;
                io.emit('removeFriend', {
                    source: source,
                    target: target
                });
            }
        });
    });

http.listen(3000, () => {
    console.log('listening on port 3000');
});
