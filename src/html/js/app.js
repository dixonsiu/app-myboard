var mb = {};

mb.msgData = null;

const APP_URL = "https://app-mywork.demo-eu.personium.io/";

getProtectedBoxAccessToken4ExtCellEngineEndPoint = function() {
    return Common.getAppCellUrl() + "__/html/Engine/getProtectedBoxAccessToken4ExtCell";
};

getRefreshTokenEngineEndPoint = function() {
    return Common.getAppCellUrl() + "__/html/Engine/refreshProtectedBoxAccessToken";
};

getStartOAuth2EngineEndPoint = function() {
    return Common.getAppCellUrl() + "__/html/Engine/start_oauth2";
};

getNamesapces = function() {
    return ['common', 'glossary'];
};

getAppDataPath = function() {
    return 'experiences/note.json';
};

/*
 * To be combine with the default hash to produce the following:
 * {
 *     type: 'GET',
 *     dataType: 'text',
 *     url: targetCell + getAppDataPath(),
 *     headers: {
 *         'Authorization':'Bearer ' + token,
 *     }
 *  }
 */
getAppRequestInfo = function() {
    return {
        dataType: 'text'
    };
};

getAppRole = function(auth) {
    if (auth == "read") {
        // Currently we only allow role with read permission.
        return 'MyWorkViewer';
    }
};

getAuthorityAppRole = function(auth) {
    let result = auth;
    switch (auth) {
        case "owner":
            result = "MyWorkOwner";
            break;
        case "editor":
            result = "MyWorkEditor";
            break;
        case "viewer":
            result = "MyWorkViewer";
            break;
    }

    return result;
}

getAppRoleAuthority = function(roleName) {
    let result = roleName;
    switch (roleName) {
        case "MyWorkOwner":
            result = "owner";
            break;
        case "MyWorkEditor":
            result = "editor";
            break;
        case "MyWorkViewer":
            result = "viewer";
            break;
    }

    return result;
}
getAppRoleAuthorityName = function(roleName) {
    let result = roleName;
    switch (roleName) {
        case "MyWorkOwner":
            result = i18next.t("Authority.owner");
            break;
        case "MyWorkEditor":
            result = i18next.t("Authority.editor");
            break;
        case "MyWorkViewer":
            result = i18next.t("Authority.viewer");
            break;
    }

    return result;
}

getAppRoleAuthorityList = function(roleList) {
    let result = "";
    for (var i = 0; i < roleList.length; i++) {
        result += getAppRoleAuthorityName(roleList[i]) + ", ";
    }
    result = result.slice(0,-2);
    return result;
}

additionalCallback = function() {
    mb.displayOwnBoardMessage();

    Common.Drawer_Menu();

    Common.setRefreshTimer();

    Common.getProfileName(Common.getTargetCellUrl(), Common.displayMyDisplayName);

    if (Common.getTargetCellUrl() !== Common.getCellUrl()) {
        $("#other_btn").hide();
        $(".menu-list").addClass("disable-field");
    }

    $('#txtMyBoard').on('click', function () {
        Common.getAppDataAPI(Common.getBoxUrl(), Common.getToken()).done(function(data) {
            var msgData = JSON.parse(data);
            if (msgData.locked && msgData.locked !== "" && msgData.locked !== Common.getCellUrl()) {
                // Messages that can not be edited because it is being edited
                let msg_key = "glossary:modalDialog.updatingMyBoard.msg";
                Common.showWarningDialog(msg_key, function() {
                    $('#modal-common').modal('hide');
                });
                $("#modal-common .modal-body")
                .attr('data-i18n', '[html]' + msg_key).localize({name: msgData.locked});
            } else {
                // Editable
                if (mb.msgData.message !== msgData.message) {
                    // When the currently displayed message is old, a confirmation message for updating is displayed
                    Common.showConfirmDialog("glossary:modalDialog.updateMyBoard.msg", function() {
                        $('#txtMyBoard').val(msgData.message);
                        mb.msgData.message = msgData.message
                        $('#modal-common').modal('hide');
                        mb.removeReadOnly(msgData.message);
                    }, function() {
                        $('#modal-common').modal('hide');
                        mb.removeReadOnly(msgData.message);
                    });
                } else {
                    // Remove readonly
                    mb.removeReadOnly(msgData.message);
                }
            }
        });
    });

    $('#edit_btn').on('click', function () {
        mb.myboardReg();
    });

    $("#extCellMyBoard").on('show.bs.collapse', function() {
        $("#sendAllowedMessage").removeClass('in');
        $("#sendAllowedMessage").attr("aria-expanded", false);
        $("#listAllowed").removeClass('in');
        $("#listAllowed").attr("aria-expanded", false);
        $("#receiveMessage").removeClass('in');
        $("#receiveMessage").attr("aria-expanded", false);
        $("#popupReadAllowedErrorMsg").empty();
    });
    $("#sendAllowedMessage").on('show.bs.collapse', function() {
        $("#extCellMyBoard").removeClass('in');
        $("#extCellMyBoard").attr("aria-expanded", false);
        $("#listAllowed").removeClass('in');
        $("#listAllowed").attr("aria-expanded", false);
        $("#receiveMessage").removeClass('in');
        $("#receiveMessage").attr("aria-expanded", false);
        $("#popupSendAllowedErrorMsg").empty();
    });
    $("#listAllowed").on('show.bs.collapse', function() {
        $("#sendAllowedMessage").removeClass('in');
        $("#sendAllowedMessage").attr("aria-expanded", false);
        $("#extCellMyBoard").removeClass('in');
        $("#extCellMyBoard").attr("aria-expanded", false);
        $("#receiveMessage").removeClass('in');
        $("#receiveMessage").attr("aria-expanded", false);
    });
    $("#receiveMessage").on('show.bs.collapse', function() {
        $("#sendAllowedMessage").removeClass('in');
        $("#sendAllowedMessage").attr("aria-expanded", false);
        $("#listAllowed").removeClass('in');
        $("#listAllowed").attr("aria-expanded", false);
        $("#extCellMyBoard").removeClass('in');
        $("#extCellMyBoard").attr("aria-expanded", false);
    });

    Common.hideSpinner("body");
};

mb.removeReadOnly = function(message) {
    mb.registerMyBoardAPI(Common.getCellUrl(), message).done(function() {
        $('#txtMyBoard').attr('readonly',false);
        // To reflect changes to the editable state, specify the focus again.
        $('#txtMyBoard').blur();
        $('#txtMyBoard').focus();

        // Switch the browsing button of the other person on the upper right to the save button
        $("#other_btn").hide();
        $("#edit_btn").show();
    }).fail(function() {

        Common.displayMessageByKey("glossary:msg.error.noWritePermission");
    });
}

mb.grantReadOnly = function() {
    $('#txtMyBoard').attr('readonly',true);
    $('#txtMyBoard').blur();

    // Switch the browsing button of the other person on the upper right to the save button
    $("#other_btn").show();
    $("#edit_btn").hide();
}

irrecoverableErrorHandler = function() {
    $("#collapse-id").empty();
};

mb.displayOwnBoardMessage = function() {
    let boxUrl = Common.getBoxUrl();
    let token = Common.getToken();
    Common.showSpinner(".main_box");
    mb.displayBoardMessage(boxUrl, token); // AJAX
};

mb.displayBoardMessage = function(boxUrl, token) {
    Common.getAppDataAPI(boxUrl, token).done(function(data) {
        mb.msgData = JSON.parse(data);
        $('.write_board').val(mb.msgData.message);
        $('.disp_board').css("display", "block");
    }).always(function() {
        Common.hideSpinner(".main_box");
    });
};

mb.myboardReg = function() {
    var strTxt = $("#txtMyBoard").val();
    mb.msgData.message = strTxt;
    mb.registerMyBoardAPI("", mb.msgData.message).done(function() {
        $("#txtMyBoard").val(strTxt);
        mb.grantReadOnly();
    }).fail(function(data) {
        var status = data.status;
        if (status == 403) {
            Common.displayMessageByKey("glossary:msg.error.noWritePermission");
        } else {
            Common.displayMessageByKey("glossary:msg.error.failedToWrite");
        }
    });
};

mb.registerMyBoardAPI = function(locked, message) {
    json = {
        "locked" : locked,
        "message" : message
    };
    return $.ajax({
        type: "PUT",
        url: Common.getBoxUrl() + getAppDataPath(),
        data: JSON.stringify(json),
        dataType: 'json',
        headers: {
            'Authorization':'Bearer ' + Common.getToken(),
            'Accept':'application/json'
        }
    });
}

mb.getReceivedMessageAPI = function() {
    return $.ajax({
        type: "GET",
        url: Common.getCellUrl() + '__ctl/ReceivedMessage?$filter=startswith%28Title,%27MyBoard%27%29&$orderby=__published%20desc',
        headers: {
            'Authorization':'Bearer ' + Common.getToken(),
            'Accept':'application/json'
        }
    });
};
