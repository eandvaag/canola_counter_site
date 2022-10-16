
function create_image_set_list() {

    let username_width = "100px";
    let farm_name_width = "200px";
    let field_name_width = "200px";
    let mission_date_width = "100px";
    


    for (let username of Object.keys(all_datasets)) {
        for (let farm_name of Object.keys(all_datasets[username])) {
            for (let field_name of Object.keys(all_datasets[username][farm_name])) {
                for (let mission_date of Object.keys(all_datasets[username][farm_name][field_name])) {
                    let id = username + ":" + farm_name + ":" + field_name + ":" + mission_date;
                    $("#image_sets_table").append(
                        `<tr>` + 
                        /*
                            `<td style="width: ${username_width}">` + username + `</td>` +
                            `<td style="width: ${farm_name_width}">` + farm_name + `</td>` +
                            `<td style="width: ${field_name_width}">` + field_name + `</td>` +
                            `<td style="width: ${mission_date_width}">` + mission_date + `</td>` +*/
                            `<td>` +
                                `<div class="table_entry" style="text-align: left; width: 99%">` +
                                    `<input type="checkbox" id="${id}" value="${id}" class="datasets_checkbox" name="datasets_checkbox">` +
                                    `<label for="${id}">${id}</label>` +
                                `</div>` +
                            `</td>` +
                        `</tr>`
                    );
                }
            }
        }
    }
}


//$(document).ready(function() {

function initialize_train() {

    create_image_set_list();


    $("#submit_button").click(function() {
        let image_sets = [];

        $("input[name=datasets_checkbox]").each(function() {
            if (this.checked) {
                //console.log($(this).val());
                let id = $(this).val();
                let pieces = id.split(":");
                image_sets.push({
                    "username": pieces[0],
                    "farm_name": pieces[1],
                    "field_name": pieces[2],
                    "mission_date": pieces[3],
                    "images": all_datasets[pieces[0]][pieces[1]][pieces[2]][pieces[3]]["annotated_images"]
                })
            }

        });

        console.log("image_sets", image_sets);
        /*
        let sel_id = model_radio.filter(":checked").val();
        
        let image_sets = [{
            "username": "kaylie",
            "farm_name": "Saskatoon", // "MORSE", //"UNI",
            "field_name": "Norheim1", //"Dugout", //"LowN1",
            "mission_date": "2021-05-26", //"2022-05-27", //"2021-06-07",
            "images": data["kaylie"]["Saskatoon"]["Norheim1"]["2021-05-26"]["annotated_images"]
                        //data["kaylie"]["UNI"]["LowN1"]["2021-06-07"]["annotated_images"]
        },
        {
            "username": "kaylie",
            "farm_name": "Saskatoon", // "MORSE", //"UNI",
            "field_name": "Norheim2", //"Dugout", //"LowN1",
            "mission_date": "2021-05-26", //"2022-05-27", //"2021-06-07",
            "images": data["kaylie"]["Saskatoon"]["Norheim2"]["2021-05-26"]["annotated_images"]
                        //data["kaylie"]["UNI"]["LowN1"]["2021-06-07"]["annotated_images"]
        }
        ];
        */
        let model_name = $("#model_name_input").val();

        $.post($(location).attr('href'),
        {
            action: "train",
            model_name: model_name,
            image_sets: image_sets,
            public: "yes"
        },
    
        function(response, status) {
    
            if (response.error) {  
                //show_modal_message("Error", "An error occurred during the generation of the density map.");  
    
            }
            else {

                show_modal_message("Success", "Your train request has been successfully submitted.");
    
            }
        });
    });
    
}
//});


