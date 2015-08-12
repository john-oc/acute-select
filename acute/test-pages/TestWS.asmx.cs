using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Web;
using System.Web.Services;

namespace acute.test_pages
{
    /// <summary>
    /// Summary description for TestWS
    /// </summary>
    [WebService(Namespace = "http://tempuri.org/")]
    [WebServiceBinding(ConformsTo = WsiProfiles.BasicProfile1_1)]
    [System.ComponentModel.ToolboxItem(false)]
    // To allow this Web Service to be called from script, using ASP.NET AJAX, uncomment the following line. 
    [System.Web.Script.Services.ScriptService]
    public class TestWS : System.Web.Services.WebService
    {
        [WebMethod]
        public List<string> GetItemData()
        {
            Thread.Sleep(500);

            return new List<string>
            {
                "Take",
                "Your",
                "Pick",
                "From",
                "These"
            };
        }
    }
}
