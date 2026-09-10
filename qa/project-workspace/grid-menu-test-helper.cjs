// Enter the disclosure before interacting with either independent grid toggle.
module.exports=(page,id)=>{
 const locator=page.locator('#'+id);
 const open=async()=>{if(await page.locator('#gridSubmenu').isHidden())await page.locator('#dockGridMenu').click();};
 return {getAttribute:(...args)=>locator.getAttribute(...args),click:async()=>{await open();await locator.click();},focus:async()=>{await open();await locator.focus();}};
};
