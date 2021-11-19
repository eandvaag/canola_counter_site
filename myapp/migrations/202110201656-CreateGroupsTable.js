'use strict';

module.exports = {
    up: (queryInterface, Sequelize) => {

        return queryInterface.createTable('groups', {
            uuid: {
                allowNull: false,
                primaryKey: true,
                type: Sequelize.UUID
            },
            creator: {
                allowNull: false,
                type: Sequelize.STRING
            },
            name: {
                allowNull: true,
                type: Sequelize.STRING
            },
            description: {
                allowNull: true,
                type: Sequelize.STRING
            },
            farm_name: {
                allowNull: false,
                type: Sequelize.STRING
            },
            field_name: {
                allowNull: false,
                type: Sequelize.STRING
            },
            mission_date: {
                allowNull: false,
                type: Sequelize.STRING
            },
            dataset_name: {
                allowNull: false,
                type: Sequelize.STRING
            },
            model_uuids: {
                allowNull: false,
                type: Sequelize.STRING(4096)
            },
            model_names: {
                allowNull: false,
                type: Sequelize.STRING(4096)
            },            
            prediction_dirnames: {
                allowNull: false,
                type: Sequelize.STRING(4096)
            },
            system_group: {
                allowNull: false,
                type: Sequelize.BOOLEAN
            },
            highlighted_param: {
                allowNull: true,
                type: Sequelize.STRING
            },
            replications: {
                allowNull: true,
                type: Sequelize.INTEGER
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });
        /*, {
            uniqueKeys: {
                views_unique: {
                    fields: ['creator', 'name']
                }
            }
        });*/
    },
    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable('groups');
    }
};