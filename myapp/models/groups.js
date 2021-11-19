'use strict';


module.exports = (sequelize, DataTypes) => {
    var groups = sequelize.define('groups', {

        uuid: {
            allowNull: false,
            primaryKey: true,
            type: DataTypes.UUID
        },
        creator: {
            allowNull: false,
            type: DataTypes.STRING
        },
        name: {
            allowNull: true,
            type: DataTypes.STRING
        },
        description: {
            allowNull: true,
            type: DataTypes.STRING
        },
        farm_name: {
            allowNull: false,
            type: DataTypes.STRING
        },
        field_name: {
            allowNull: false,
            type: DataTypes.STRING
        },        
        mission_date: {
            allowNull: false,
            type: DataTypes.STRING
        },
        dataset_name: {
            allowNull: false,
            type: DataTypes.STRING
        },
        model_uuids: {
            allowNull: false,
            type: DataTypes.STRING(4096)
        },
        model_names: {
            allowNull: false,
            type: DataTypes.STRING(4096)
        },        
        prediction_dirnames: {
            allowNull: false,
            type: DataTypes.STRING(4096)
        },
        system_group: {
            allowNull: false,
            type: DataTypes.BOOLEAN
        },
        highlighted_param: {
            allowNull: true,
            type: DataTypes.STRING
        },
        replications: {
            allowNull: true,
            type: DataTypes.INTEGER
        }
    });

    return groups;
}