// Setup EPICOR.IMR.DataSourceContent name space
EPICOR.namespace('EPICOR.IMR.StatusReport.Model');

EPICOR.IMR.StatusReport.View = function() {
    "use strict";
    EPICOR.IMR.StatusReport.View.count = ++EPICOR.IMR.StatusReport.View.count || 0;
    // Guard against this object not being invoked with the "new" operator
    if (!(this instanceof EPICOR.IMR.StatusReport.View)) {
        return new EPICOR.IMR.StatusReport.View();
    }

    var publicInterface,
        config,
        container,
        roles,
        token,
        appId,
        moduleId,
        userName,
        dataFilesGrid,
        supportFilesGrid,
        toolBar,
        submitProcessButton,
        notesButton,
        fileMapButton,
        attachButton,
        deleteDataSourceButton,
        deleteFilesButton,
        addInterchangeChildButton,
        receivedDateText,
        descriptionText,
        supplierText,
        mapper,
        grid_current_pages = 0,
        grid_page_totals = {},
        grid_intervals = {},
        cont_type,
        sub_type,
        id,
        base_url = location.protocol + '//' + location.host;
    // Instance ID based on current static count
    id = "DSC_" + EPICOR.IMR.StatusReport.View.count;
    /**
     *
     */
    function initControls() {
        //	initDataSourceToolbarButtons();
        initDataFilesGrid();
        // Set custom icon on refresh button for grids
        container.find('.ui-pg-div span').removeClass('ui-icon').html('<img src="' + config.URL.REFRESH_ICON + '"></img>');
        dataFilesGrid.jqGrid('navButtonAdd', '#status_report_grid_' + moduleId + '_toppager_left', {
            caption: '',
            buttonicon: 'ui-icon-circle-arrow-s',
            title: 'Expand Grid Columns'
        });
        dataFilesGrid.jqGrid('navButtonAdd', '#status_report_grid_' + moduleId + '_toppager_left', {
            caption: '',
            buttonicon: 'ui-icon-circle-arrow-n',
            title: 'Collapse Grid Columns'
        });
        dataFilesGrid.jqGrid('navButtonAdd', '#status_report_grid_' + moduleId + '_toppager_left', {
            caption: '',
            buttonicon: 'ui-icon-disk',
            title: 'Export'
        });
        dataFilesGrid.jqGrid('navButtonAdd', '#status_report_grid_' + moduleId + '_left', {
            caption: '',
            buttonicon: 'ui-icon-circle-arrow-s',
            title: 'Expand Grid Columns'
        });
        dataFilesGrid.jqGrid('navButtonAdd', '#status_report_grid_' + moduleId + '_left', {
            caption: '',
            buttonicon: 'ui-icon-circle-arrow-n',
            title: 'Collapse Grid Columns'
        });
        $(".ui-icon-circle-arrow-s").on('click', function() {
            dataFilesGrid.find("tr.jqgrow td").addClass('grid-grow');
        });
        $(".ui-icon-circle-arrow-n").on('click', function() {
            dataFilesGrid.find("tr.jqgrow td").removeClass('grid-grow');
        });
        $(".ui-icon-disk").on('click', function() {
            exportExcel();
        });
        dataFilesGrid.addSearchTool({
            imgPath: '/activant/jquery/plugins/grid/plugins/jqgrid-search-crud/images/',
            filter: true,
            download: false,
            dialogObject: $("#main_dialog"),
            onSearchClick: function() {
                $(publicInterface).trigger(config.CFG.GRID_SEARCH_EVENT);
            }
        });
        dataFilesGrid.setGridParam({
            afterInsertRow: formatRowColumns
        });
        dataFilesGrid.jqGrid('setColProp', 'lnkdatasrc', {
            formatter: fileActionsFormatter
        });
        dataFilesGrid.jqGrid('setColProp', 'dataValFlagColor', {
            formatter: formatDataValStatusFlag
        });
        dataFilesGrid.jqGrid('setColProp', 'ccuFlagColor', {
            formatter: formatCCUstatusFlag
        });
        dataFilesGrid.jqGrid('setColProp', 'dataVal2FlagColor', {
            formatter: formatDataVal2StatusFlag
        });
        dataFilesGrid.jqGrid('setColProp', 'processStatusFlagColor', {
            formatter: formatProcessStatusFlag
        });
        dataFilesGrid.navGrid(dataFilesGrid.getGridParam('pager'), {
            search: false,
            refresh: true,
            edit: false,
            add: false,
            del: false,
            cloneToTop: true
        });

    }

    function exportExcel() {
        var mya = [];
        mya = dataFilesGrid.getDataIDs(); // Get All IDs
        var data = dataFilesGrid.getRowData(mya[0]); // Get First row to get the labels
        var colNames = [];
        var ii = 0;
        for (var i in data) {
            if (data.hasOwnProperty(i)) {
                colNames[ii++] = i;
            }
        } // capture col names
        var html = '';
        for (var k = 5; k < colNames.length; k++) {
            if (colNames[k].indexOf('FlagColor') === -1) {
                html = html + '"' + colNames[k] + '",'; // output each Column as tab delimited
            }
        }
        html = html + "\n"; // Output header with end of line
        for (i = 0; i < mya.length; i++) {
            data = dataFilesGrid.getRowData(mya[i]); // get each row
            var x = '';
             for (var j = 5; j < colNames.length; j++) {
                x = data[colNames[j]];
                x = x.replace(/"/g, "'");
                x = x.replace(/\n/g, "'");
                x = x.replace(/null/g, "");
                if (x.indexOf('span title') === -1) {
                    html = html + '"' + x + '",'; // output each Row as tab delimited
                }
                // html = html + data[colNames[j]] + '","'; // output each Row as tab delimited
            }

            html = html + "\n"; // output each row with end of line
            html = html.replace(/,\n/g, "\n");
        }
        html = html + "\n"; // end of line at the end
        var a = document.createElement('a');
        a.href = "data:attachment/csv;charset=utf-8,\uFEFF" + encodeURI(html);
        a.target = '_blank';
        a.download = 'export.tab';
        $('#status_report_grid_' + moduleId + '_toppager_left').append(a);
        a.click();
        //  dataFilesGrid.jqGrid('navButtonAdd', '#status_report_grid_'+moduleId+'_toppager_left', { caption: '', buttonicon: 'ui-icon-disk', title: 'Export'});
        //  $(".ui-icon-disk").on('click', function() {
        //	   a();
        //	});
    }

    function taskStatusFormatter(value, options, row) {
        var imgElement = (value === 'null') ? '' : '<img src="/epicor/shared/images/flags/flag_' + value.toLowerCase() + '_16x16.png"></img>';

        return '<span class="flag-icon">' + imgElement + '</span>';
    }

    function formatRow(row) {
        // XXX Hover highlight and alternating row color kludge
        row.hover(function() {
            if ($(this).hasClass("ui-priority-secondary")) {
                $(this).removeClass('ui-priority-secondary')
                    .attr('altRow', 'yes');
            }
        }, function() {
            if (!$(this).hasClass('ui-state-highlight')) {
                if ($(this).attr('altRow') === 'yes') {
                    $(this).addClass('ui-priority-secondary')
                        .removeAttr('altRow');
                }
            }
        });
    }

    function formatTaskCell(col, taskId, flagColor) {
        formatClickableCell(col, taskId, flagColor);
        formatCellForMenu(col);
    }

    function formatClickableCell(col, taskId, flagColor) {
        $(col).addClass("pointer-cell");
        $(col).find("img")
            .attr("taskId", taskId)
            .attr("state", flagColor);
    }

    function formatCellForMenu(col) {
            $(col).hover(function() {
                $(this).addClass("menu-cell");
                $(this).append("<span class='flag-menu-icon ui-icon ui-icon-triangle-1-s'></span>");
            }, function() {
                $(this).removeClass("menu-cell");
                $(this).find(".ui-icon-triangle-1-s").remove();
            });
        }
        /**
         *
         */
    function fileActionsFormatter(val, options, row) {
        return '<span class="file-options-icon" title="View Data Source Menu" style="cursor:pointer;" datarow="' + options.rowId + '"><img src="/epicor/shared/images/menu_16x16.png" ></span>';
    }

    function formatDataSourceIcon(val, options, row) {
        return '<span class="file-options-icon" style="cursor:pointer;" datarow="' + options.rowId + '"><img src="/epicor/shared/images/menu.png" ></span>';
    }

    function formatRowColumns(rowId, rowData, rowFullData) {
            var row,
                cols;

            row = $("tr#" + rowId);
            cols = row.children("td");

            formatRow(row);

            // Add pointer for menu column
            formatTaskCell(cols[0], "", "");

            // File Actions column
            formatTaskCell(cols[4], rowFullData.loadStatusFlagColor, rowFullData.loadTaskId);

            // Map Parent columnm
            formatClickableCell(cols[5]);

            // Setup column
            formatClickableCell(cols[6]);


        }
        /**
         *
         */
    function initDataFilesGridOptions(gridOptions) {

        // Non static options
        gridOptions.pager = "#" + config.CSS.DATA_FILES_PAGER + "_" + moduleId;
        //gridOptions.gridComplete = gridCompleteHandler;

        gridOptions.gridComplete = function() {
            //    dataFilesGrid.trigger("jqGrid.gridComplete");
            //    gridCompleteHandler();

        };
        gridOptions.onPaging = function(p_paging) {
            //   pagingRecords(p_paging);
        };
        window.onresize = function() {
            //    $(publicInterface).trigger(config.CFG.GRID_SEARCH_EVENT);
            //      dataFilesGrid.trigger("reloadGrid");
        };

        return gridOptions;
    }

    /**
     *
     */


    /**
     *
     */
    function dataSourcePropertiesFormatter(val, options, row) {
        return '<span class="' + config.CSS.PROPERTIES + '" title="' + config.MSG.FILE_PROPERTIES_TIP + '"><img src="' + config.URL.PROPERTIES_ICON + '"></img></span>';
      }

    function pagingRecords(p_name) {
        var l_arr = p_name.split('_');
         pagingDashBoardRecords(p_name);
     }

    function pagingDashBoardRecords(p_name) {
            var l_name = 'status_report_' + id;
            var l_val = jQuery("#status_report_grid_" + id + "_toppager_center")
                .find('td:last')
                .find('select')
                .val();
            var sp1 = "sp_1_status_report_pager_" + id;
            var l_pager_input = jQuery('span[id=' + sp1 + ']').siblings('input');
            if (isNaN(l_pager_input.val())) {
                l_pager_input.val(grid_current_pages);
            } else { //number
                if (l_pager_input.val() < 1) { //less than 1
                    l_pager_input.val(grid_current_pages);
                } else {
                    if (l_pager_input.val() > (grid_page_totals[l_name] * 1)) { //>max allowed
                        l_pager_input.val(grid_current_pages);
                    } else { //valid good
                        grid_current_pages = l_pager_input.val();

                        $(publicInterface).trigger(config.CFG.GRID_PAGING_EVENT, {
                            grid_name: l_name,
                            grid_container: jQuery('#status_report_detail_container'),
                            max: l_val,
                            offset: ((l_pager_input.val() - 1) * l_val)
                        });

                    }
                }
            }
        }
        /**
         *
         */
    function dataSourceInProcessFormatter(val, options, row) {
        //
        val = (val === 'False') ? 'No' : 'Yes';

        return '<span>' + val + '</span>';
    }

    /**
     *
     */
    function dataSourceDownloadFormatter(val, options, row) {
        var url,
            paramString;

        if (row.contentTypeCode !== config.CFG.ACES_INTERCHANGE_CHILD) {
            url = base_url + config.URL.DATA_SOURCE_CONTENT_FILE_DOWNLOAD + "/" + row[config.CFG.CONTENT_ID_COLUMN_NAME];
            paramString = $.param({
                "Authorization": token,
                "Authorization-Application": appId
            });

            return '<a download href="' + url + '?' + paramString + '" title="' + config.MSG.DOWNLOAD_TIP + '"><img src="' + config.URL.DOWNLOAD_ICON + '"></img></span>';
        } else {
            return '&nbsp;';
        }
    }

    /**
     *
     */
    function dataSourceCommentFormatter(val, options, row) {
        return '<span class="' + config.CSS.NOTE + '" title="' + config.MSG.FILE_NOTES_TIP + '"><img src="' + config.URL.NOTES_ICON + '"></img></span>';
    }

    /**
     *
     */
    function dataSourceFileNameFormatter(val, options, row) {
        //
        val = (val === 'null') ? '' : val;

        return '<span>' + val + '</span>';
    }

    /**
     *
     */
    function dataSourceDocTitleFormatter(val, options, row) {
        //
        val = (val === 'null') ? 'N/A' : val;

        return '<span>' + val + '</span>';
    }

    /**
     *
     */
    function dataSourceDocNumFormatter(val, options, row) {
        //
        val = (val === 'null') ? '' : val;

        return '<span>' + val + '</span>';
    }

    /**
     *
     */
    function dataSourceDescriptionFormatter(val, options, row) {
        //
        val = (val === 'null') ? '' : val;

        return '<span>' + val + '</span>';
    }

    /**
     *
     */
    function addPointerToClickableCells() {

        /*
         * I don't like this but we want the pointer on the whole cell,
         * not just the cell's contents.  I currently don't know how
         * else to achieve this.
         */
        $('.' + config.CSS.PROPERTIES).parent().css('cursor', 'pointer');
        $('.' + config.CSS.DOWNLOAD).parent().css('cursor', 'pointer');
        $('.' + config.CSS.NOTE).parent().css('cursor', 'pointer');
    }

    /**
     *
     */
    function gridsearch() {
        $(publicInterface).trigger(config.CFG.GRID_SEARCH_EVENT);
    }

    function dataGridClickEventHandler(rowId, iCol, value, event) {
        var colModel,
            rowData,
            contentId,
            cellName,
            lnkdatasrc,
            dataSourceId;

        colModel = dataFilesGrid.jqGrid("getGridParam", "colModel");
        cellName = colModel[iCol].name;
        rowData = dataFilesGrid.jqGrid('getRowData', rowId);

        contentId = rowData[config.CFG.CONTENT_ID_CELL];
        dataSourceId = rowData[config.CFG.DATA_SOURCE_ID_COLUMN_NAME];
        lnkdatasrc = rowData[config.CFG.MENU_EVENT];
        if (cellName !== config.CFG.MENU_EVENT) {

            $(publicInterface).trigger(config.CFG.GRID_CELL_CLICK_EVENT, {
                cellName: colModel[iCol].name,
                contentId: contentId,
                dataSourceId: dataSourceId,
                rowid: rowId
            });
        }
    }

    /*
     *
     */
    function gridCellAutoSuggestHandler(rowId, cellName, value, iRow, iCol) {
        $("#status_report_grid").find('.ui-state-highlight').removeClass('ui-state-highlight');
        dataFilesGrid.find(".ui-state-highlight, [aria-selected='true']").removeClass('ui-state-highlight');
        $('#' + rowId + '_' + cellName).focus(function() {
            this.select();
        });
        dataFilesGrid.jqGrid('setCell', rowId, cellName, '', 'ui-state-highlight');
        if (cellName === 'supplierName') {
            $("#" + rowId + "_supplierName").autocomplete({
                minLength: 0,
                source: function(request, response) {
                    $(publicInterface).trigger(config.CFG.SUPPLIER_GRID_AUTOCOMPLETE_EVENT, {
                        field: config.CFG.SUPPLIER_FIELD,
                        value: $("#" + rowId + "_supplierName").val().trim(),
                        row: rowId,
                        response: response
                    });
                },
                select: function(p_event, p_ui) {
                    dataFilesGrid.jqGrid('setCell', rowId, 'supplierId', p_ui.item.id, '');
                }
            });

            /*		search: function() {
            		    $(publicInterface).trigger(config.CFG.SUPPLIER_GRID_AUTOCOMPLETE_EVENT, {
            			field: config.CFG.SUPPLIER_FIELD,
            			value: $("#" +rowId+"_supplierName").val(),
            			row: rowId
            		    });}
            	    },
            	    {
            		source: []
            	    }
            	    ); */
        }
        if (cellName === 'description') {
            var l_rowdata = dataFilesGrid.getRowData(rowId);
            var l_supplier_id = l_rowdata[config.CFG.SUPPLIER_ID_CELL];
            var l_supplier = l_rowdata[config.CFG.SUPPLIER_NAME_CELL];
            $("#" + rowId + "_description").autocomplete({
                minLength: 0,
                source: function(request, response) {
                        $(publicInterface).trigger(config.CFG.DESCRIPTION_GRID_AUTOCOMPLETE_EVENT, {
                            field: config.CFG.SUPPLIER_FIELD,
                            value: l_supplier,
                            field2: config.CFG.DESCRIPTION_FIELD,
                            value2: $("#" + rowId + "_description").val(),
                            row: rowId,
                            response: response
                        });
                    }
            });
        }
    }

    function setDataFilesGridFilter() {
        // Filter to shown only data file content types
        dataFilesGrid.setGridParam({
            search: true
        });
    }


    /**
     *
     */
    function initDataFilesGrid() {
        var gridOptions;

        // Set unique ID on the grid table and pager
        container.find('.' + config.CSS.DATA_FILES_GRID).attr('id', config.CSS.DATA_FILES_GRID + "_" + moduleId);
        container.find('.' + config.CSS.DATA_FILES_PAGER).attr('id', config.CSS.DATA_FILES_PAGER + "_" + moduleId);

        // Set object references to the grid
        dataFilesGrid = container.find('#' + config.CSS.DATA_FILES_GRID + "_" + moduleId);

        // Add non static grid options
        gridOptions = initDataFilesGridOptions(config.CFG.DATA_GRID_OPTIONS);

        gridOptions.onCellSelect = dataGridClickEventHandler;

        // Initialize the grid
        dataFilesGrid.jqGrid(gridOptions);

        dataFilesGrid.navGrid(dataFilesGrid.getGridParam('pager'), {
            search: false,
            refresh: true,
            edit: false,
            add: false,
            del: false,
            cloneToTop: true,
            afterRefresh: function() {
                // Forces the filter to be set on refresh
                $("#status_report_grid").clearGridData(true);
                $(publicInterface).trigger(config.CFG.REFRESH_EVENT);
                toggleToolbarButtons();
            }
        });
    }

    /**
     *
     */


    /**
     * Note: Using container.find() to set the button instance variables bacause it might be
     * possible to have another DSC container on a page
     *
     */
    function initDataSourceToolbarButtons() {

        // Init variables for the toolbar controls
        toolBar = container.find("." + config.CSS.DATA_SOURCE_TOOLBAR);

        // Init toolbar Button
        /*
         * Event deligation to the containing div for the button toolbar.
         * This pattern reduces the number of event handerlers.
         */
        toolBar.on('click', 'button', function(event) {

            // Prevent event propogation or "bubbling up"
            event.preventDefault();

            // XXX This is clumsy needs refactoring
            var classList = $(event.currentTarget).attr('class'),
                classArray = classList.split(" "),
                uniqueClass;

            // XXX Need selected row content ID and or data source id
            if (classArray.length >= 2) {
                // Second class in list is the unique class for the button
                uniqueClass = classArray[1].trim();

                // Make sure the class is what we are looking for
                if (uniqueClass.indexOf('data-source-') >= 0) {
                    $(publicInterface).trigger(config.CFG.TOOL_BAR_CLICK_EVENT, {
                        button: uniqueClass
                    });
                }
            }
        });

    }

    /*
     *
     */
    function toggleToolbarButtons() {


        }
        /**
         *
         */
    function clearDataFilesGridData() {
        dataFilesGrid.jqGrid("clearGridData", true).trigger("reloadGrid");
    }

    /**
     *
     */
    function hasRole(role, roles) {
        var role1 = roles.indexOf(role);
        var role2 = roles.indexOf(config.CFG.SUPER_USER_ROLE);
        if (role2 > 0) {
            return true;
        }
        if (role1 < 1) {
            return false;
        } else {
            return true;
        }
        // return (roles.indexOf(role) >= 0) || (roles.indexOf(config.CFG.SUPER_USER_ROLE));
    }

    function formatCCUstatusFlag(p_val, p_options, p_row) {
        var l_title = p_row.ccuStatusTxt;
        var l_taskId = p_row.ccuStatusId;
        var l_status = p_row.ccuStatusTxt;

        return formatStatusFlags(p_val, p_options, p_row, l_title, "", l_taskId, l_status);
    }

    function formatDataValStatusFlag(p_val, p_options, p_row) {
        var l_title = p_row.dataValStatusTxt;
        var l_taskId = p_row.dataValStatusId;
        var l_status = p_row.dataValStatusTxt;

        return formatStatusFlags(p_val, p_options, p_row, l_title, "", l_taskId, l_status);
    }

    function formatProcessStatusFlag(p_val, p_options, p_row) {
        var l_title = p_row.processStatusTxt;
        var l_taskId = p_row.processStatusId;
        var l_status = p_row.processStatusTxt;

        return formatStatusFlags(p_val, p_options, p_row, l_title, "", l_taskId, l_status);
    }

    function formatDataVal2StatusFlag(p_val, p_options, p_row) {
        var l_title = p_row.dataVal2StatusTxt;
        var l_taskId = p_row.dataVal2StatusId;
        var l_status = p_row.dataVal2StatusTxt;

        return formatStatusFlags(p_val, p_options, p_row, l_title, "", l_taskId, l_status);
    }

    function formatStatusFlags(p_val, p_options, p_row, p_title, p_menu, p_taskId, p_status) {
        var l_taskId = '';
        var l_status = '';
        var l_flag = "";
        var l_val = "";

        if (p_val === 'null' || p_val === null || p_val === '') {
            l_flag = "";
            return '<span title="' + p_title + '" ></span>';
        } else {
            if (typeof p_taskId !== 'undefined') {
                l_taskId = p_taskId;
            }

            if (typeof p_status !== 'undefined') {
                l_status = p_status;
            }

            l_val = p_val.toLowerCase();
            l_flag = l_val;
            if (p_menu) {
                return '<div id="' + p_options.colModel.name + p_options.rowId + '"' + '><span title="' + p_title + '" ><img style="cursor:pointer;"  taskid="' + l_taskId + '" status="' + l_status + '" rowid="' + p_options.rowId + '" dataid="' + p_row.id + '" state="' + p_val + '" class="' + p_options.colModel.dtype + '" src="./images/flags/flag_' + l_flag + '_16x16.png" /></span></div>';
            } else {
                return '<div id"' + p_options.colModel.name + p_options.rowId + '"' + '><span title="' + p_title + '" ><img  src="./images/flags/flag_' + l_flag + '_16x16.png" /></span></div>';
            }
        }
    }

    function setTwoDigits(p_val) {
        if (p_val.toString().length < 2) {
            return '0' + p_val.toString();
        }
        return p_val;
    }

    function initInterchange(data) {
        var i;

        receivedDateText = container.find("." + config.CSS.RECEIVED_DATE);
        descriptionText = container.find("." + config.CSS.DESCRIPTION);
        supplierText = container.find("." + config.CSS.SUPPLIER_TEXT);
        receivedDateText.datepicker({
            dateFormat: 'mm/dd/yy',
            showAnim: 'scale'
        });
        var l_date = new Date();
        var l_mn = l_date.getMonth() + 1;
        var l_dy = l_date.getDate();
        var l_yr = l_date.getFullYear();

        var date2 = setTwoDigits(l_mn) + '/' + setTwoDigits(l_dy) + '/' + l_yr;
        // Show calendar on date picker when clicking the icon also
        container.find(".interchange img").on('click', function() {
            receivedDateText.datepicker("show");
        });
        $('.supplier-text').val(data.items[0].supplierName);
        $('.supplier-text').attr({
            rval: data.items[0].supplierId
        });
        $('.supplier-id').val(data.items[0].supplierId);
        $('.choose-date')
            .val(date2)
            .datepicker({
                showAnim: 'scale',
                showOn: "button",
                buttonImage: "/epicor/shared/images/calendar.png",
                buttonImageOnly: true
            });

        $('.supplier-text').autocomplete({
            minLength: 0,
            source: function(request, response) {
                $(publicInterface).trigger(config.CFG.SUPPLIER_AUTOCOMPLETE_EVENT, {
                    field: config.CFG.SUPPLIER_FIELD,
                    value: $('.supplier-text').val(),
                    response: response
                });
            },
            select: function(p_event, p_ui) {
                $('.supplier-id').val(p_ui.item.id);
                //     dataFilesGrid.jqGrid('setCell',rowId,'supplierId',p_ui.item.id, '');
            }
        });
        $('.description-text').autocomplete({
            minLength: 0,
            source: function(request, response) {
                    $(publicInterface).trigger(config.CFG.DESCRIPTION_AUTOCOMPLETE_EVENT, {
                        field: config.CFG.SUPPLIER_FIELD,
                        value: $('.supplier-text').val(),
                        field2: config.CFG.DESCRIPTION_FIELD,
                        value2: $('.description-text').val(),
                        response: response
                    });
                }
         });
        $(publicInterface).trigger(config.CFG.INIT_COMPLETE);
    }

    function autocompleteSelectFocusEventHandling(p_obj, p_event, p_ui) {
        jQuery(p_obj)
            .val(p_ui.item.label)
            .attr({
                title: p_ui.item.value + ': ' + p_ui.item.label,
                rval: p_ui.item.value
            });
        return false;
    }

    function autocompleteChangeEventHandling(p_obj, p_event, p_ui) {
            var l_match = false;
            jQuery('.ui-autocomplete').children().each(function(id, obj) {
                if (jQuery(obj).find('a').html().toLowerCase() === jQuery(p_obj).val().toLowerCase()) {
                    l_match = true;
                } else {
                    if (jQuery(p_obj).attr('title')) {
                        var t_val = jQuery(p_obj).attr('title').split(':')[1];
                        if (t_val) {
                            if (jQuery.trim(jQuery(obj).find('a').html().toLowerCase()) === jQuery.trim(t_val.toLowerCase().replace(/&/g, '&amp;'))) {
                                jQuery(p_obj).val(jQuery.trim(t_val));
                                l_match = true;
                            }
                        }
                    }
                }
            });

            if (l_match === false) {
                jQuery(p_obj).attr({
                    rval: 0
                });
            }
            return false;
        }
        /**
         *
         */
    function showProcessDialog(title, msg, errorInd, errMsg, content) {
            var dialog,
                module,
                container;

            container = $('<div>');
            if (errorInd === '1') {
                dialog = new EPICOR.IMR.DialogFactory.factory(EPICOR.IMR.DialogFactory.BasicType);
            } else {
                dialog = new EPICOR.IMR.DialogFactory.factory(EPICOR.IMR.DialogFactory.OkCancelType);
            }
            dialog.setTitle(title);
            dialog.setContent($('<img class="' + config.CSS.QUESTION_ICON_CLASS + '" src="' + config.URL.QUESTION_ICON + '"><div class="' + config.CSS.DIALOG_MESSAGE + '">' + msg + errMsg + '</p></div>'));
            dialog.on('ok', function() {

                //    deferred.resolve();
                if (errorInd === '0') {
                    $(publicInterface).trigger(config.CFG.SUBMIT_CONTENT, {
                        field: 'contentids',
                        value: content
                    });
                }
            });
            dialog.open();


        }
        /**
         * Setup the grid pagingation events
         *
         * @private
         * @method       setupGridPagination
         * @param        (String)      p_name    grid name
         * @param        (Integer)     p_total   record total
         */
    function setupGridPagination(p_total) {
        var p_name = 'status_report_grid_' + id;
        //	status_report_pager_DSC_0_center
        var l_int_object = jQuery("#status_report_pager_" + id + "_center").find('td:last').find('select');

        var l_page = (grid_current_pages) ? grid_current_pages : 1;
        var l_interval = grid_intervals[p_name];
        if (grid_intervals[p_name] === undefined) {
            l_interval = l_int_object.val();
            grid_intervals[p_name] = l_interval;
        }
        l_int_object.val(l_interval);
        setupPagingNavigationEvents(p_name);

        grid_current_pages = l_page;
        grid_page_totals[p_name] = Math.ceil(p_total / l_interval);

        setupPagingNavigationButtons(p_name, grid_page_totals[p_name], l_page);
        setupPagingDisplayText(p_name, l_page, l_interval, p_total);

    }

    function hideToppager() {
            $("#status_report_grid_" + id + "_toppager_center").hide();
            $("#status_report_grid_" + id + "_toppager_right").hide();

        }
        /**
         * Setup the paging text
         *
         * @private
         * @method
         * @param        (String)      p_name        grid name
         * @param        (Integer)     p_page        current page
         * @param        (Integer)     p_interval    grid data interval (range)
         * @param        (Integer)     p_total       total records
         */
    function setupPagingDisplayText(p_name, p_page, p_interval, p_total) {
        var l_range_low = 0;
        var l_range_high = 0;

        //text display
        l_range_high = (p_total < p_interval) ? p_total : (p_interval * p_page);
        l_range_low = (p_total < p_interval) ? 1 : (l_range_high - p_interval + 1);
        l_range_high = (l_range_high >= p_total) ? p_total : l_range_high;

        //right display
        jQuery('#status_report_pager_' + id + '_right')
            .find('div')
            .html('View ' + l_range_low + ' - ' + l_range_high + ' of ' + p_total);

        //center page text box
        jQuery('#status_report_pager_' + id + '_center')
            .find('input[role="textbox"]')
            .val(p_page);

        //center display
        //    sp_1_status_report_grid_DSC_0_toppager
        //    sp_1_status_report_pager_DSC_1
        // var sp1="sp_1_status_report_pager_"+id;
        // var sp2="sp_1_status_report_toppager_"+id;
        jQuery('span[id="sp_1_status_report_pager_' + id + '"]').html(grid_page_totals[p_name]);
        jQuery('span[id="sp_1_status_report_toppager_' + id + '"]').html(grid_page_totals[p_name]);

    }

    /**
     * Setup the grid pagingation navigation buttons
     *
     * @private
     * @method       setupPagingNavigationButtons
     * @param        (String)      p_name      grid name
     * @param        (Integer)     p_tpages    total pages
     * @param        (Integer)     p_page      current page
     */
    function setupPagingNavigationButtons(p_name, p_tpages, p_page) {
        var l_next_obj = jQuery('#status_report_pager_' + id + '_center').find('td[id="next_status_report_pager_' + id + '"]');
        var l_first_obj = jQuery('#status_report_pager_' + id + '_center').find('td[id="first_status_report_pager_' + id + '"]');
        var l_last_obj = jQuery('#status_report_pager_' + id + '_center').find('td[id="last_status_report_pager_' + id + '"]');
        var l_prev_obj = jQuery('#status_report_pager_' + id + '_center').find('td[id="prev_status_report_pager_' + id + '"]');
        if (p_tpages > 1) {
            if (p_page !== p_tpages) {
                l_next_obj.removeClass('ui-state-disabled');
                l_last_obj.removeClass('ui-state-disabled');
            }
            if (p_page > 1) {
                l_prev_obj.removeClass('ui-state-disabled');
                l_first_obj.removeClass('ui-state-disabled');
            }
        }
    }

    /**
     * Setup the grid pagingation navigation events
     *
     * @private
     * @method       setupPagingNavigationEvents
     * @param        (String)      p_name    grid name
     */
    function setupPagingNavigationEvents(p_name) {
            //next_status_report_pager_DSC_0
            var l_next_obj = jQuery('#status_report_pager_' + id + '_center').find('td[id="next_status_report_pager_' + id + '"]');
            var l_first_obj = jQuery('#status_report_pager_' + id + '_center').find('td[id="first_status_report_pager_' + id + '"]');
            var l_last_obj = jQuery('#status_report_pager_' + id + '_center').find('td[id="last_status_report_pager_' + id + '"]');
            var l_prev_obj = jQuery('#status_report_pager_' + id + '_center').find('td[id="prev_status_report_pager_' + id + '"]');
            //   sp_1_status_report_pager_DSC_1
            //  var l_pager_input = jQuery('span[id="sp_1_'+p_name+'_Pager"]').siblings('input');
            var l_pager_input = jQuery('span[id="sp_1_status_report_pager_' + id + '"]').siblings('input');

            l_pager_input
                .unbind('blur')
                .bind('blur', function() {
                    if (grid_current_pages !== l_pager_input.val()) {
                        pagingRecords(p_name);
                    }
                });

            l_next_obj
                .unbind('click')
                .bind('click', function() {
                    if ((l_pager_input.val() * 1) !== (grid_page_totals[p_name] * 1)) {
                        l_pager_input.val((l_pager_input.val() * 1) + 1);
                        pagingRecords(p_name);
                    }
                });

            l_last_obj
                .unbind('click')
                .bind('click', function() {
                    l_pager_input.val(grid_page_totals[p_name]);
                    pagingRecords(p_name);
                });

            l_prev_obj
                .unbind('click')
                .bind('click', function() {
                    if ((l_pager_input.val() * 1) !== 1) {
                        l_pager_input.val(((l_pager_input.val() * 1) - 1));
                        pagingRecords(p_name);
                    }
                });

            l_first_obj
                .unbind('click')
                .bind('click', function() {
                    l_pager_input.val(1);
                    pagingRecords(p_name);
                });
        }
        //----- Public Methods -----//
    publicInterface = {

        /**
         *
         */
        init: function(pContainer, pConfig, id, pRoles, pToken, pAppId) {
            container = pContainer;
            config = pConfig;
            moduleId = id;
            roles = pRoles;
            token = pToken;
            appId = pAppId;
        },
        /**
         *
         */
        cleanUp: function() {
            publicInterface = null;
            container = null;
            dataFilesGrid = null;
            supportFilesGrid = null;
            config = null;
            moduleId = null;
            roles = null;
            token = null;
            appId = null;
            //	    dataFilesGrid.jqGrid( 'GridDestroy' );
        },
        /**
         *
         */
        setDataSourceContentHtml: function(data) {
            container.html(data);
            initControls();
        },
        /**
         *
         */
        setSubmissionTypeDropDownData: function(data) {
            //    dataFilesGrid.jqGrid('setColProp', config.CFG.SUBMISSION_TYPE_CELL, {editoptions: {value: data}});
        },
        /**
         *
         */
        /**
         *
         */
        setCellAutoSuggestData: function(cellId, data) {
            var cell = container.find("#" + cellId);

            cell.autocomplete({
                source: data
            });
        },
        /**
         *
         */
        loadFileGrids: function(data, totalCount, resetPage) {
            if (resetPage === 'r') {
                grid_current_pages = 0;
            }
            var deferred = $.Deferred();
            dataFilesGrid.on('jqGrid.gridComplete', function() {
                deferred.resolve();
            });
            // Undocumented method for loading data in grid
            dataFilesGrid[0].p.data = data;
            // Get the grid to display the data loaded
            dataFilesGrid.trigger("reloadGrid");
            jQuery('.file-options-icon')
                .unbind('click')
                .bind('click', function() {
                    var rowData = dataFilesGrid.jqGrid('getRowData', jQuery(this).attr('datarow'));
                    var contentId = rowData.contentid;
                    var dataSourceId = rowData.itemDataSourceId;
                    var lnkinfo = rowData.lnkinfo;
                    $(publicInterface).trigger(config.CFG.GRID_CELL_CLICK_EVENT, {
                        cellName: 'lnkdatasrc',
                        contentId: contentId,
                        dataSourceId: dataSourceId,
                        lnkinfo: lnkinfo,
                        positionl: jQuery(this).position().left,
                        positiont: jQuery(this).position().top
                    });

                });
             return deferred.promise();

        },

        /**
         *
         */
        showAttachFileDialog: function(dataSourceId) {
            var promise,
                dialog,
                l_refresh,
                buttons,
                module;
            localStorage.setItem('ref', '1');
            dialog = new EPICOR.IMR.DialogFactory.factory(EPICOR.IMR.DialogFactory.CustomType);
            module = new EPICOR.IMR.ContentUploadUtility(token, appId, {}, []); // XXX no options no roles
            buttons = {
                //    Close: function() {
                //        dialog.trigger("close");
                //        dialog.dialog("close");
                //     },
                Upload: function() {
                    dialog.trigger("upload");
                }
            };
            dialog.setButtons(buttons);
            dialog.setContent(module.getContent());
            dialog.setTitle('Attach Files');
            dialog.attr('id', 'uploadutil');
            dialog.on("upload", function() {
                module.submitFileForUpload();
            });
            promise = module.getContentUploadUtility(dataSourceId, 'A');

            promise.done(function() {
                dialog.open();
            });

            dialog.on("close", function() {
                var l_refresh = localStorage.getItem('ref');
                if (l_refresh === '2') {
                    publicInterface.clearGrids();
                    $(publicInterface).trigger(config.CFG.ATTACH_FILES_COMPLETE_EVENT);
                    //	    localStorage.clear();
                }
            });
        },
        showDataSourceContentDialog: function(dataSourceId) {
            var promise,
                dialog,
                l_refresh,
                buttons,
                module;
            dialog = new EPICOR.IMR.DialogFactory.factory(EPICOR.IMR.DialogFactory.DSCType);
            module = new EPICOR.IMR.DataSourceContent(token, appId, '', userName, roles);
            dialog.setContent(module.getContent());
            dialog.setTitle(module.name);
            promise = module.showDataSourceContent(dataSourceId);
            promise.done(function() {
                dialog.open();
            });
            dialog.on("close", function() {
                $(this).dialog("destroy").remove();
            });
            promise.fail(function() {
                alert("Error displaying Data Source Content"); // XXX need consistent error handling
            });
        },
        /**
         *
         */
        showFileNotesDialog: function(id, type) {
            var dialog,
                module,
                container,
                promise;

            container = $('<div>');
            dialog = new EPICOR.IMR.DialogFactory.factory(EPICOR.IMR.DialogFactory.CustomType);
            module = new EPICOR.IMR.FileNotes(token, appId, {}, []); // XXX no options no roles

            dialog.setContent(module.getContent());
            dialog.setTitle(module.name);
            if (type === 'd') {
                dialog.setTitle("Data Source Notes");
            } else {
                dialog.setTitle(module.name);
            }
            promise = module.showFileNotes(id, 'c');
            promise.done(function() {
                dialog.open();
            });
            dialog.on("close", function() {
                $(this).dialog("destroy").remove();
            });
            promise.fail(function() {
                alert("Error displaying Notes dialog"); //  need consistent error handling
            });
        },
        /**
         *
         */
        showFilePropertiesDialog: function(contentId, dataSourceId) {
            var dialog,
                module,
                promise;
            dialog = new EPICOR.IMR.DialogFactory.factory(EPICOR.IMR.DialogFactory.CustomType);
            module = new EPICOR.IMR.FileProperties(token, appId, {}, []); //  no options no roles

            promise = module.getFileProperties(contentId, dataSourceId);
            dialog.setContent(module.getContent());
            dialog.setTitle(module.name);
            //
            promise.done(function() {
                dialog.open();
            }).fail(function() {
                 //  alert("Error showing File Properties."); //  handle error better/consistent - refactor
            });
            dialog.on("close", function() {
                $(this).dialog("destroy").remove();
            });
        },
        /**
         *
         */
        showFileInformationDialog: function(contentId) {
            var dialog,
                module,
                promise;
            dialog = new EPICOR.IMR.DialogFactory.factory(EPICOR.IMR.DialogFactory.CustomType);
            module = new EPICOR.IMR.FileInformation(token, appId, {}, []); // XXX no options no roles

            promise = module.showFileInformation(contentId);
            dialog.setContent(module.getContent());
            dialog.setTitle(module.name);
            //
            promise.done(function() {
                dialog.open();
            }).fail(function() {
                //   alert("Error showing File Information."); // XXX handle error better/consistent - refactor
            });
            dialog.on("close", function() {
                $(this).dialog("destroy").remove();
            });
        },
        /**
         *
         */
        clearGrids: function() {
            clearDataFilesGridData();
            toggleToolbarButtons();
        },
        showUpdateErrorDialog: function(data, title) {
            var dialog,
                deferred = $.Deferred();

            dialog = new EPICOR.IMR.DialogFactory.factory(EPICOR.IMR.DialogFactory.ModalType);
            if (title) {
                dialog.setTitle(title);
            } else {
                dialog.setTitle("Update Error");
            }

            dialog.setContent($('<img class="' + config.CSS.QUESTION_ICON_CLASS + '" src="' + config.URL.QUESTION_ICON + '"><div class="' + config.CSS.DIALOG_MESSAGE + '">' + data + '</p></div>'));
            dialog.on('ok', function() {
                deferred.resolve();
            });
            dialog.open();

            return deferred.promise();
        }


    };

    return publicInterface;
};