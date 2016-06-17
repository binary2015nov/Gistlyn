﻿using System;
using System.Collections.Generic;
using Funq;
using Gistlyn.Common.Interfaces;
using Gistlyn.Common.Objects;
using Gistlyn.DataContext;
using Gistlyn.ServiceInterface;
using Gistlyn.ServiceInterfaces.Auth;
using ServiceStack;
using ServiceStack.Auth;
using ServiceStack.Caching;
using ServiceStack.Configuration;
using ServiceStack.Data;
using ServiceStack.OrmLite;
using ServiceStack.Text;

namespace Gistlyn.TestHost
{
    public class AppHost : AppHostBase
    {
        /// <summary>
        /// Default constructor.
        /// Base constructor requires a name and assembly to locate web service classes. 
        /// </summary>
        public AppHost()
            : base("Gistlyn", typeof(MyServices).Assembly)
        {

        }

        /// <summary>
        /// Application specific configuration
        /// This method should initialize any IoC resources utilized by your web service classes.
        /// </summary>
        /// <param name="container"></param>
        public override void Configure(Container container)
        {
            JsConfig.EmitCamelCaseNames = true;

            Plugins.Add(new ServerEventsFeature()
            {
                HeartbeatInterval = TimeSpan.FromSeconds(30),
                IdleTimeout = TimeSpan.FromSeconds(100),
                OnConnect = (IEventSubscription arg1, Dictionary<string, string> arg2) =>
                {
                    Console.WriteLine("OnConnect");
                },
                OnCreated = (IEventSubscription arg1, ServiceStack.Web.IRequest arg2) =>
                {
                    Console.WriteLine("OnCreated");
                },
                OnSubscribe = (IEventSubscription obj) => 
                { 
                    Console.WriteLine("OnSubscribe");
                },
                OnUnsubscribe = (IEventSubscription obj) => 
                {
                    Console.WriteLine("OnUnsubscribe");
                }
            });
            //this.CustomErrorHttpHandlers.Remove(HttpStatusCode.Forbidden);

            //container.RegisterAutoWiredAs<MemoryChatHistory, IChatHistory>();

            container.Register<MemoizedResultsContainer>(new MemoizedResultsContainer());

            //session and authentication
            container.Register<ICacheClient> (new MemoryCacheClient ());
            Plugins.Add (new SessionFeature ());
            container.Register<UserSession> (new UserSession (container.Resolve<ICacheClient> ()));

            //Config examples
            //this.Plugins.Add(new PostmanFeature());

            //To limit access to scripts only from the known sites
            //this.Plugins.Add(new CorsFeature(allowedOrigins: "http://127.0.0.1:8080", allowCredentials: true));
            this.Plugins.Add(new CorsFeature());

            container.Register<IAppSettings>(new AppSettings());

            var config = new WebHostConfig(container.Resolve<IAppSettings>());

            container.Register<WebHostConfig>(config);

            IDbConnectionFactory dbFactory = new OrmLiteConnectionFactory(
                config.ConnectionString,
                SqliteDialect.Provider);

            dbFactory.Open();

            container.Register<IDataContext>(new GistlynDataContext(dbFactory));

            //Define the Auth modes you support and where to store it
            ConfigureAuthAndRegistrationServices (container);
        }

        private void ConfigureAuthAndRegistrationServices (Funq.Container container)
        {
            //Enable and register existing services you want this host to make use of.
            //var userSession = new CustomUserSession ();

            //Register all Authentication methods you want to enable for this web app.
            Plugins.Add (new AuthFeature (
                () => new CustomUserSession(),
                new IAuthProvider [] {
                new EmptyAuthProvider(container.Resolve<UserSession>())
            }, null));

            //Provide service for new users to register so they can login with supplied credentials.
            //RegistrationFeature.Init(this);

            //override the default registration validation
            //container.RegisterAs<CustomRegistrationValidator, IValidator<Registration>>();

            //Store User Data 
            container.Register<IUserAuthRepository> (c =>
                 new InMemoryAuthRepository ());

            //var authRepo = (OrmLiteAuthRepository)container.Resolve<IUserAuthRepository>();
            //authRepo.DropAndReCreateTables(); //Drop and re-create all Auth and registration tables
            //authRepo.CreateMissingTables(); //Create only the missing tables

            return;
        }
    }
}