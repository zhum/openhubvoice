$(function () {
    $('.tree li:has(ul)').addClass('parent_li').find(' > span.root').attr('title', 'Collapse this branch');
    $('.tree li.parent_li > span.root').on('click', function (e) {
        var children = $(this).parent('li.parent_li').find(' > ul > li');
        if (children.is(":visible")) {
            children.hide('fast');
            $(this).attr('title', 'Expand this branch').find(' > i').addClass('icon-plus-sign').removeClass('icon-minus-sign');
        } else {
            children.show('fast');
            $(this).attr('title', 'Collapse this branch').find(' > i').addClass('icon-minus-sign').removeClass('icon-plus-sign');
        }
        e.stopPropagation();
    });
	
	
	$(".add").click(function(){
$.ajax({
type: "POST",
url: "/admin-rest",
data: { add: "true"}
})
.done(function( msg ) {
if(msg == 1){
location.reload();
}
});
	});


/*

$.post(
  "/admin-rest",
  {
    fetch: "true"
  },
  function(data){i = data;}
);
*/
 $.ajax({
type: "POST",
url: "/admin-rest",
data: { fetch: "true"}
})
.done(function( msg ) {
var data = $.parseJSON(msg)
data = data.aiml.category;
ss = data;
for(var i = 0;i < data.length;i++){
var toapp = '<div class="col-sm-6 col-lg-6"><div class="dash-unit"><dtitle>AI Block<span class="icon-minus remove" data-remove="' + (i + 1) +'"></span></dtitle><hr><div class="info-user"><span aria-hidden="true" class="li_display fs2"></span></div><br><div class="text"><div class="tree"><ul><li><span class="root" data-id=' + (i + 1) + '><i class="icon-folder-open"></i><p class="edit" data-edit="pattern">' + data[i].pattern.toString() + '</p></span> <a href="" class=" icon-arrow-right"></a> <span> <p class="edit" data-edit="template">' + data[i].template.toString() + '</p></span><ul><li><span class="root" data-sub="1"><i class="icon-minus-sign"></i> <p class="edit" data-edit="pattern">' + data[i].subcategory[0].pattern.toString() + '</p></span><a href="" class=" icon-arrow-right"></a> <span> <p class="edit" data-edit="template">' + data[i].subcategory[0].template.toString()  + '</p></span><ul><li><span class="root" data-sub="2"><i class="icon-leaf"></i> <p class="edit" data-edit="pattern">' + data[i].subcategory[1].pattern.toString()  + '</p></span> <a href="" class=" icon-arrow-right"></a> <span> <p class="edit" data-edit="template">' + data[i].subcategory[1].template.toString()  + '</p></span></li></ul></li></ul></li></div></div></div></div>';
$(".inject").append(toapp);
}

	 $('.edit').editable('/admin-rest', {
	  submitdata : function(value, settings) {
	  var dataid = $(this).parent().attr("data-id");
	  var datasub;
	  if(!dataid){
	  dataid = $(this).parent().parent().parent().parent().parent().find("span.root").attr("data-id");
	  if(!dataid){
	 dataid = $(this).parent().parent().parent().parent().parent().parent().parent().find("span.root").attr("data-id"); 
	  }
	  datasub = $(this).parent().attr("data-sub");
	  if(!datasub){
	  datasub = $(this).parent().parent().find("span.root").attr("data-sub");
	  }
	  }
	  var typeid =  $(this).attr("data-edit");
       return {dataid: dataid, typeid: typeid, datasub: datasub};
   }
      });
	  
	  
	  
	  	$(".remove").click(function(){
$.ajax({
type: "POST",
url: "/admin-rest",
data: { dataid: $(this).attr("data-remove"), remove : true}
})
.done(function( msg ) {
if(msg == 1){
location.reload();
}
});
	});
	  
	  
	  
});


if(location.hash != "#main"){
location.hash = "#main";
Android.ispanel();
}
});
